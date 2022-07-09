<script setup lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { onMounted, watch, reactive, ref, nextTick } from 'vue'
import { MINI_STATE, FULL_STATE, NORMAL_STATE } from '@/utils/screen'
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

const emit = defineEmits<{
  /*
   * request MailApp.vue show or hide the back2List icon
   * request: true, show back2List icon
   * request: false, hide it
   */
  (e: 'contextMenu', request: boolean): void
}>()

const props = defineProps<{
  widthState: number
  mailbox: MailboxInfo
  miniState: boolean // true: msgList; false: msgContent;
}>()

let currentAccountId: string | null = null
const msgcontent_id = 'msgcontent' // use msgcontent_id to scrollTo top (0,0)
const msgcontent_eleid = ref(msgcontent_id)

const hasRemoteResource = ref(false)
const showRemoteResource = ref(false)
const inlineBlobList = new Set<string>()
function initMediaUI() {
  hasRemoteResource.value = false
  showRemoteResource.value = false
  inlineBlobList.clear()
}

const threadSubject = ref('') // 当前阅读的邮件会话


// 以下三个变量传参给 MsgList 组件
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
    renderMailbox(props.mailbox, pos)
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
    threadSubject.value = subject ? subject:NULL_SUBJECT
    if (widthState.value == MINI_STATE) {
      showListInContent.value = false
      emit('contextMenu', true)
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
  if (props.mailbox.id !== PLACEHOLDER_MAILBOXID) {
    console.log('dev-mode: render mailview for %s, with %d', props.mailbox.id, props.widthState)
    onWatch(props.widthState)
    renderMailbox(props.mailbox)
    totalThreads.value = props.mailbox.total
  }
})

watch(
  props.mailbox, // 现在 mailbox 参数直接是一个 reactive object, 无需 getter()
  (newArg, oldArg) => {
    renderMailbox(newArg)
    totalThreads.value = newArg.total
    // when MailApp.vue change 'props.mailbox', it will change 'props.miniState' to `true`
    // that be watched by next lines, and set 'showListInContent' to `true`
  }
)

watch(
  () => props.miniState,
  (newArg, oldArg) => {
    // the operation in MailApp.vue only generate `TRUE`-miniState/msgList-in-MiniUI signal
    // ignore `newArg == false` here
    if (newArg) {
      showListInContent.value = true
    }
  }
)

const widthState = ref(NORMAL_STATE)
const showListInContent = ref(false)
function onWatch (state: number): void {
  widthState.value = state

  if (state == MINI_STATE) {
    if (threadSubject.value == '') { // 此时 MsgContent 是界面初始化时候的占位内容
      showListInContent.value = true
      emit('contextMenu', false)
    } else {
      showListInContent.value = false
      emit('contextMenu', true)
    }
  } else {
    showListInContent.value = false
  }
}

watch(
  () => props.widthState,
  (newState, oldState) => {
    onWatch(newState)
  }
)

</script>
<template>
  <div class="mailview">
    <MsglistView :msgList="msgList" :totalThreads="totalThreads" :paginationData="paginationData"
      @page="switchPos"
      @read="readThread"
      :class="widthState == FULL_STATE ? 'msglist-full' : 'msglist-normal'" v-if="widthState > MINI_STATE" />

    <div class="msgcontent" :id="msgcontent_eleid">
      <MsglistView :msgList="msgList" :totalThreads="totalThreads" :paginationData="paginationData"
        @page="switchPos"
        @read="readThread"
        v-if="showListInContent" />
      <div v-else>
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
      <div v-if="showModal"
        style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,.5); z-index: 500;
        display: flex;
        align-items: center;
        justify-content: center;">
        <div style="background-color: #fefefe; display: flex; flex-direction: column;"
          :class="widthState == MINI_STATE?'mini-modal-content':'normal-modal-content'">
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
    </div>
  </div>
</template>

<style>
.mailview {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
}

.msgcontent {
  flex-grow: 1;
  background-color: #fefefe;
  color: #344955;
  width: 0; /* 防止被子元素撑出横向滚动条 */
  overflow-y: auto;
  text-align: left;
}

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
