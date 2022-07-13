<script setup lang="ts">
import { onMounted, watch, reactive, ref, nextTick, inject } from 'vue'
import { MINI_STATE } from '@/utils/screen'
import { PLACEHOLDER_MAILBOXID, NULL_SUBJECT,
  MessageLIST, MsgListPagination,
  ThreadContents, MailboxInfo,
  $globalState
} from '@/utils/global'
import MsglistView from '@/components/MsgList.vue'
import { fillThreadContents, replaceCID } from '@/utils/readmail'
import { fillMsgList } from '@/utils/listmail'
import { JAttachment } from '@/utils/jclient'
import { fuzzyDatetime, downloadFName } from '@/utils/common'
import ResponsiveColumn from '@/components/ResponsiveColumn.vue'
import { useRoute } from 'vue-router'
import { boxList, store } from '@/utils/store'
import type {contextMenuFunc} from '@/utils/store'
import { IEmailProperties } from 'jmap-client-ts/lib/types'
const contextMenu = inject('contextMenu') as contextMenuFunc
const route = useRoute()

let currentAccountId: string | null = null
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

// next three variables pass to MsgList component
const totalThreads = ref(0)
const msgList: MessageLIST = reactive([])
const paginationData: MsgListPagination = reactive({
  prevPos: -1,
  nextPos: -1,
  currList: '',
})

function renderMailbox (mailbox: MailboxInfo, pos: number = 0): void {
  currentAccountId = mailbox.accountId
  $globalState.jclient?.msglist_get(mailbox.accountId, mailbox.id, pos)
  .then(list=>{
    fillMsgList(list, mailbox, pos, msgList, paginationData)
  })
}

function switchPos (pos: number) {
  if (pos >= 0) {
    renderMailbox(mailboxInfo, pos)
  } else {console.log(pos)}
}

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

  $globalState.jclient?.thread_get(currentAccountId, id).then(list => {
    store.focusRightColumn = true
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
        accountId: currentAccountId,
        update: setSeenObj,
      }).then(result => {
        console.log('Seen:', result.updated)
        if (currentAccountId == $globalState.accountId) {
          boxList.forEach(item => {
            if (item.id == mailboxInfo.id && item.props) {
              if (item.props.unreadThreads > 0) {
                item.props.unreadThreads --
              }
              return
            }
          })
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
      replaceCID(currentAccountId, inlineBlobList)
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
  let accountId = currentAccountId as string
  $globalState.jclient?.client.download(accountId, blobId, fname, type).then(blob => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
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
  store.focusRightColumn = false
  if (route.query.id && route.query.accountId && route.query.total) {
    console.log('dev-mode: render mailview.vue for %s or switch from other function-block', route.query.id)
    parseQuery(route.query)
    renderMailbox(mailboxInfo)
    totalThreads.value = mailboxInfo.total
  }
})

const mailboxInfo: MailboxInfo = {id: PLACEHOLDER_MAILBOXID, total: 0, accountId: null}
function parseQuery(obj: any) {
  mailboxInfo.id = obj.id as string
  mailboxInfo.accountId = obj.accountId as string
  mailboxInfo.total = Number.parseInt(obj.total as string, 10)
}
watch(
  () => route.query,
  (newArg, oldArg) => {
    parseQuery(newArg)
    renderMailbox(mailboxInfo)
    totalThreads.value = mailboxInfo.total
  },
)

</script>
<template>
  <ResponsiveColumn>
    <template v-slot:left>
      <MsglistView :msgList="msgList" :totalThreads="totalThreads" :paginationData="paginationData"
      @page="switchPos"
      @read="readThread" />
    </template>
    <template v-slot:right><div style="overflow-y: auto; height: 100%;" :id="msgcontent_id">
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
      <div v-if="showModal"
        style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,.5); z-index: 500;
        display: flex;
        align-items: center;
        justify-content: center;">
        <div style="background-color: #fefefe; display: flex; flex-direction: column;"
          :class="store.widthState == MINI_STATE?'mini-modal-content':'normal-modal-content'">
          <div class="appbar">
            <span style="color: #d2dbe0;">CenterIt</span>
            <span style="vertical-align: middle;">Email Header Detail...</span>
            <button @click="showModal=false" style="float: right; margin-right: 6px;">close</button>
          </div>
          <div style="flex: 1; margin: 6px; overflow-y: auto;" class="as-pre">{{headerLines}}</div>
          <div style="display: flex; justify-content: center; align-items: center;
            height: 32px; border-top: 1px solid #4A6572; ">
            <button style="" @click="downloadEml" >download email</button>
          </div>
        </div>
      </div>
    </div></template>
    <template v-slot:left-toolbar>
      <span class="toolbar-icon">
        <font-awesome-icon icon="arrow-pointer" />
        <i class="title">Select</i>
      </span>
      <span class="toolbar-icon">
        <font-awesome-icon icon="trash-can" />
        <i class="title">Trash</i>
      </span>
      <span class="toolbar-icon">
        <font-awesome-icon icon="folder-open" />
        <i class="title">Move</i>
      </span>
    </template>
  </ResponsiveColumn>
</template>

<style>
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
