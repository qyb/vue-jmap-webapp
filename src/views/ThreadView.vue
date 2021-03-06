<script setup lang="ts">
import { onMounted, watch, reactive, ref, nextTick, inject } from 'vue'
import { MINI_STATE } from '@/utils/screen'
import { NULL_SUBJECT, ThreadContents, $globalState } from '@/utils/global'
import MsglistView from '@/components/MsgList.vue'
import { fillThreadContents, replaceCID } from '@/utils/readmail'
import { JAttachment } from '@/utils/jclient'
import { fuzzyDatetime, downloadFName } from '@/utils/common'
import ResponsiveColumn from '@/components/ResponsiveColumn.vue'
import ModalComponent from '@/components/Modal.vue'
import { useRoute } from 'vue-router'
import { boxList, store, renderMailbox } from '@/utils/store'
import type {contextMenuFunc} from '@/utils/store'
import { IEmailGetResponse, IEmailProperties } from 'jmap-client-ts/lib/types'
const contextMenu = inject('contextMenu') as contextMenuFunc
const route = useRoute()

const msgcontent_id = 'msgcontent' // use msgcontent_id to scrollTo top (0,0)

const hasRemoteResource = ref(false)
const showRemoteResource = ref(false)
const inlineBlobList = new Set<string>()
function initMediaUI() {
  hasRemoteResource.value = false
  showRemoteResource.value = false
  inlineBlobList.clear()
}

const threadSubject = ref('') // current Thread

// next variable pass to MsgList component
const selectMode = ref(false)

function toggleCollapse(index: number) {
  if (index == (msgContents.length - 1)) {
    // the last email always display
    return
  }
  msgContents[index].collapse = !msgContents[index].collapse
}

const msgContents:ThreadContents = reactive([])
let now: number
function _fuzzyDatetime(datetime: Date) {
  return fuzzyDatetime(now, datetime)
}

function readThread (id: string, subject: string) {
  initMediaUI()

  $globalState.jclient?.thread_get(store.currentMbox.accountId, id).then(list => {
    $globalState.focusRightColumn = true
    if (store.widthState == MINI_STATE) {
      contextMenu(true)
    }

    threadSubject.value = subject ? subject:NULL_SUBJECT

    const setSeenObj: {[id: string]: Partial<IEmailProperties>} = {}
    list.forEach(item => {
      if (!item.keywords.$seen) {
        setSeenObj[item.id] = {
          keywords: {$seen: true},
        }
      }
    })
    if (Object.keys(setSeenObj).length > 0) {
      $globalState.jclient?.client.email_set({
        accountId: store.currentMbox.accountId,
        update: setSeenObj,
      }).then(result => {
        console.log('Seen:', result.updated)
        if (store.currentMbox.accountId == $globalState.accountId) {
          boxList.forEach(item => {
            if (item.id == store.currentMbox.id && item.props) {
              if (item.props.unreadThreads > 0) {
                item.props.unreadThreads --
              }
              return
            }
          })
        } else {
          /**
           * do nothing in shared mailbox
           *
           * 1. cyrus always return shared-seen-state unreadEmails/unreadThreads count
           *    https://github.com/cyrusimap/cyrus-imapd/issues/4178
           *    unreadThreads is correct only in sharedseen:true mailbox
           *
           * 2. cannot get isSeenShared if imapd.conf `jmap_nonstandard_extensions` default off
           */
        }
      })
    }

    if (fillThreadContents(list, msgContents, inlineBlobList)) {
      hasRemoteResource.value = true
    }
    now = (new Date()).getTime()

    if (msgContents.length > 0) {
      const last = msgContents.length - 1
      msgContents[last].collapse = false // the last email always display
    }

    nextTick(()=> {
      /**
       * replaceCID use document.getElementsByClassName(blobId), it should be called after
       * reactive-objects have been render as HTMLElements.
       **/
      replaceCID(store.currentMbox.accountId, inlineBlobList)
      document.getElementById(msgcontent_id)?.scrollTo(0, 0)
    })
  })
}
const showModal = ref(false)
const headerLines = ref('')
const eml = {
  blobId: '',
  name: '',
}
function headerView(index: number): void {
  headerLines.value = msgContents[index].headers.map(item=>`${item.name}:${item.value}`).join('\r\n')
  eml.blobId = msgContents[index].blobId
  const subject = msgContents[index].subject == ''? NULL_SUBJECT:msgContents[index].subject
  const datetime = msgContents[index].receivedAt
  eml.name = `${datetime.getFullYear()}-${datetime.getMonth()}-${datetime.getDay()} ${downloadFName(subject)}.eml`
  showModal.value = true
}
function download(blobId: string, fname: string, type: string): void {
  let accountId = store.currentMbox.accountId as string
  $globalState.jclient?.client.download(accountId, blobId, fname, type).then(buffer => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([buffer]))
    link.download = fname
    link.click()
    URL.revokeObjectURL(link.href)
  })
}
function downloadEml(): void {
  download(eml.blobId, eml.name, 'message/rfc822')
}
function downloadAtt(attachment: JAttachment): void {
  download(attachment.blobId, attachment.name, attachment.type)
}

onMounted(() => {
  $globalState.focusRightColumn = false
  if (route.query.id && route.query.accountId && route.query.total) {
    console.log('dev-mode: render mailview.vue for %s or switch from other function-block', route.query.id)
    parseQuery(route.query)
  }
})

function parseQuery(obj: any) {
  store.currentMbox = {
    id: obj.id as string,
    totalThreads: Number.parseInt(obj.total as string, 10),
    accountId: obj.accountId as string,
  }
}

watch(
  () => route.query,
  (newArg, oldArg) => {
    parseQuery(newArg)
  },
)

function select() {
  selectMode.value = true
}

function cancelSelect() {
  selectMode.value = false
}

function trash () {
  if (store.trashId == '') {
    return
  }
  moveTo(store.trashId)
}

function refreshMboxList (unseenCount: number, totalCount: number, targetId?: string) {
  store.currentMbox.totalThreads -= totalCount
  boxList.forEach(item => {
    if (item.id == store.currentMbox.id && item.props) {
      item.props.unreadThreads -= unseenCount
      item.props.totalThreads -= totalCount
    }

    if (targetId && item.id == targetId && item.props) {
      item.props.unreadThreads += unseenCount
      item.props.totalThreads += totalCount
    }
  })
  let currentPos = store.paginationData.prevPos + 50
  if (store.paginationData.nextPos == -1 && totalCount == store.msgList.length) {
    // clear last page ...
    currentPos -= 50
    if (currentPos == -50) {
      currentPos = 0
    }
  }
  renderMailbox(currentPos)
}

function empty () {
  const result = checkedIds(null)
  if (result == null) return
  const ids = result.ids
  const unseenCount = result.unseenCount

  $globalState.jclient?.getEmailPropsByThreadIds(store.currentMbox.accountId, ids, {
    properties: ['mailboxIds']
  }).then(value => {
    const destroyObj: string[] = []

    value.forEach(item => {
      if (item.mailboxIds[store.currentMbox.id] == true) {
        destroyObj.push(item.id)
      }
    })

    $globalState.jclient?.client.email_set({
      accountId: store.currentMbox.accountId,
      destroy: destroyObj,
    }).then(value => {
      console.log('email_set', destroyObj, value)
      refreshMboxList(unseenCount, ids.length)
    })
  })
}

function checkedIds(targetId: string|null): {unseenCount: number, ids: string[]} | null {
  if (store.currentMbox.accountId != $globalState.accountId
  || (targetId && targetId == store.currentMbox.id)) {
    store.msgList.forEach(item => {item.checked = false})
    return null
  }
  const ids: string[] = []
  let unseenCount = 0
  store.msgList.forEach(item => {
    if (item.checked) {
      item.checked = false // unset checked
      ids.push(item.threadId)
      if (!item.seen) {
        unseenCount ++
      }
    }
  })
  if (ids.length == 0) return null
  return {unseenCount, ids}
}

function moveTo(targetId: string) {
  const result = checkedIds(targetId)
  if (result == null) return
  const ids = result.ids
  const unseenCount = result.unseenCount

  $globalState.jclient?.getEmailPropsByThreadIds(store.currentMbox.accountId, ids, {
    properties: ['mailboxIds']
  }).then(value => {
    const updateObj: {[id: string]: Partial<IEmailProperties>} = {}

    value.forEach(item => {
      if (item.mailboxIds[store.currentMbox.id] == true) {
        delete item.mailboxIds[store.currentMbox.id]
        item.mailboxIds[targetId] = true
        updateObj[item.id] = {
          mailboxIds: item.mailboxIds,
        }
      }
    })
    $globalState.jclient?.client.email_set({
      accountId: store.currentMbox.accountId,
      update: updateObj,
    }).then(value => {
      console.log('email_set', updateObj, value)
      refreshMboxList(unseenCount, ids.length, targetId)
    })
  })
}

function doMove() {
  moveTo(picked.value)
  showSelectTarget.value = false
}

const showSelectTarget = ref(false)
const picked = ref('')
function selectTarget() {
  if (selectMode.value) {
    showSelectTarget.value = true
  }
}
</script>
<template>
  <ResponsiveColumn>
    <template v-slot:left>
      <MsglistView
        :selectMode="selectMode"
        @cancel-select="cancelSelect"
        @read="readThread"
      />
      <ModalComponent
        :modal="showSelectTarget"
        :close="()=>{showSelectTarget=false}">
        <template v-slot:title>select target</template>
        <template v-slot:content>
          <div class="mfolder-list">
            <ul>
              <li v-for="item in boxList" :key="item.id"
                class="mfolder-list-item mfolder-list-itemlayout"
              >
                <span style="flex:1; cursor: pointer;">{{ item.name }}</span>
                <span>
                  <input type="radio" name="foo" v-model="picked"
                    :value="item.id"
                    :disabled="item.id == store.currentMbox.id"
                  />
                </span>
              </li>
            </ul>
          </div>
        </template>
        <template v-slot:bottom>
          <button @click="doMove()">Confirm</button>
        </template>
      </ModalComponent>
    </template>
    <template v-slot:right>
      <div style="overflow-y: auto; height: 100%;" :id="msgcontent_id">
        <div class="thread-header">
          <div class="thread-subject">{{ threadSubject }}</div>
          <div v-if="hasRemoteResource && !showRemoteResource" class="remote-resource-warning">
            <font-awesome-icon icon="triangle-exclamation"/>
            To protect your privacy remote resources have been blocked.
            <button @click="showRemoteResource=true">
              allow
            </button>
          </div>
        </div>
        <div class="thread-email" v-for="(item, index) in msgContents" :key="item.msgId">
          <div @click="toggleCollapse(index)" class="thread-email-header">
            <div v-if="item.collapse" class="thread-email-collapse">
              <span class="thread-email-from" :title="item.from.email">{{item.from.name}}</span>
              <span class="thread-email-preview"><font-awesome-icon v-if="item.attachments.length > 0" icon="paperclip" />{{item.preview}}</span>
            </div>
            <div v-else>
              <span class="thread-email-from" :title="item.from.email">{{item.from.name}}</span>
            </div>
            <!-- collect elements in ONE-DIV to avoid flex-space-between -->
            <div v-if="item.collapse">
              <span class="thread-email-date">{{_fuzzyDatetime(item.receivedAt)}}</span>
            </div>
            <div v-else>
              <span class="thread-email-date">{{_fuzzyDatetime(item.receivedAt)}}</span>
              <span class="thread-email-context">
                <font-awesome-icon icon="envelope-open-text" style="padding-left: 6px;" @click.stop="headerView(index)" />
              </span>
            </div>
          </div>
          <div class="thread-email-content" v-show="!item.collapse">
            <div v-for="body in item.body" :key="body.partId">
              <div v-if="body.txt" class="like-pre" v-text="body.safeContent"></div>
              <div v-else class="normal-block">
                <div v-if="showRemoteResource && body.withRemoteResource" v-html="body.withRemoteResource"></div>
                <div v-else v-html="body.safeContent"></div>
              </div>
            </div>
            <div v-if="item.attachments.length > 0" class="thread-email-attachments-area">
              <div v-for="att in item.attachments" class="thread-email-attachment">

                <font-awesome-icon v-if="item.attachments.length > 0" icon="paperclip" />
                <span :title="`size: ${att.size}`" @click="downloadAtt(att)">{{ att.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModalComponent
        :modal="showModal"
        :close="()=>{showModal=false}">
        <template v-slot:title>Email Header Detail...</template>
        <template v-slot:content>
          <div style="flex: 1; margin: 6px; overflow-y: auto;" class="as-pre">{{headerLines}}</div>
        </template>
        <template v-slot:bottom>
          <button @click="downloadEml">download email</button>
        </template>
      </ModalComponent>
    </template>
    <template v-slot:left-toolbar>
      <span class="toolbar-icon" @click="select()">
        <font-awesome-icon icon="arrow-pointer" />
        <i class="title">Select</i>
      </span>
      <span v-if="store.currentMbox.id!=store.trashId && store.currentMbox.id!=store.junkId" class="toolbar-icon" @click="trash()">
        <font-awesome-icon icon="trash-can" />
        <i class="title">Trash</i>
      </span>
      <span v-else class="toolbar-icon" @click="empty()">
        <font-awesome-icon icon="recycle" />
        <i class="title">Destroy</i>
      </span>
      <span class="toolbar-icon" @click="selectTarget()">
        <font-awesome-icon icon="folder-open" />
        <i class="title">Move</i>
      </span>
    </template>
  </ResponsiveColumn>
</template>

<style>
@import "@/assets/default.css";

.thread-header {
  padding-left: 6px;
  padding-right: 6px;
  margin-top: 12px;
}

.thread-subject {
  font-size: x-large;
}
.remote-resource-warning {
  margin: 4px;
  padding: 4px;
  background-color: #edf0f2; /* msglist background-color */
}

.thread-email {
  border-top: 1px solid #344955;
  margin: 6px;
}

.thread-email-header {
  display: flex;
  justify-content: space-between;
  white-space:nowrap;
  padding: 6px;
  cursor: pointer;
}

.thread-email-collapse {
  white-space:nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.thread-email-from {
  font-weight: bold;
}

.thread-email-preview {
  font-size: x-small;
  color: #4A6572; /* 600 */
  margin-left: 16px;
}
.thread-email-date {
  text-align: right;
  margin-left: 6px;
}
.thread-email-content {
  padding: 12px;
  font-size: small;
}
.thread-email-attachments-area {
  border-top: 1px solid #4A6572; /* 600 */
  display: flex;
  flex-wrap: wrap;
}

.thread-email-attachment {
  margin: 12px 12px 12px 12px;
  text-decoration: underline;
  cursor: pointer;
}

.like-pre { /* for text/plain mailView */
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
}
.normal-block {
  white-space: normal;
  word-break: break-all;
}
.as-pre { /* for headerView */
  white-space: pre;
  word-break: break-all;
  font-family: monospace;
}
.normal-modal-content {
  height: 80%;
  width: 80%;
}
.mini-modal-content {
  height: 100%;
  width: 100%;
}
</style>
