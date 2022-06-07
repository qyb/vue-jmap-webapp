<script setup lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { onMounted, watch, reactive, ref } from 'vue'
import { MINI_STATE, FULL_STATE } from '@/utils/screen';
import { IEmailAddress } from 'jmap-client-ts/lib/types'
import { PLACEHOLDER_MAILBOXID,
  MessageLIST, MsgListPagination,
  ThreadsContent, BodyMixed,
  $globalState, $globalMailbox,
} from '@/utils/global'
import { fuzzyDatetime } from '@/utils/common'
import MsglistView from '@/components/MsgList.vue'

const props = defineProps<{
  widthState: number
  mailbox: {id: string, total: number}
}>()

const threadSubject = ref('') // 当前阅读的邮件会话
const nullSubject = '(null subject)'

// 以下三个变量传参给 MsgList 组件
const totalThreads = ref(0)
const msgList: MessageLIST = reactive([])
const paginationData: MsgListPagination = reactive({
  prevPos: -1,
  nextPos: -1,
  currList: '',
})

function memberOfThread(outbound: boolean, addrList: IEmailAddress[]): string {
  let addr:string[] = []
  addrList.forEach((item) => {
    if (item.email != $globalState.loginEmail) { // skip myself addr.
      addr.push(item.name)
    }
  })

  return (outbound?'Recipient: ':'') + addr.join(',')
}

function renderMailbox (mailbox: {id: string, total: number}, pos: number = 0): void {
  let outbound = false
  if ($globalMailbox[mailbox.id] == 'sent' || $globalMailbox[mailbox.id] == 'drafts') {
    outbound = true
  }
  const now = (new Date()).getTime()
  $globalState.jclient?.msglist_get($globalState.accountId, mailbox.id, pos).then(list=>{
    msgList.length = 0
    list.forEach((item) => {
      let seen = false
      if (item.keywords && item.keywords.$seen) {
        seen = true
      }
      const datetime = new Date(item.receivedAt)
      msgList.push({
        threadId: item.threadId,
        // msglist_get guarantee from/to won't be null
        addr: memberOfThread(outbound,  (outbound?item.to:item.from) as IEmailAddress[]),
        subject: item.subject?item.subject:nullSubject,
        receivedAt: fuzzyDatetime(now, datetime),
        preview: item.preview,
        seen: seen
      })
    })

    const length = list.length
    paginationData.currList = `${pos+1}-${pos+length},`
    paginationData.prevPos = pos - 50
    paginationData.nextPos = (pos + length == totalThreads.value) ? -1 : pos + 50
    // console.log(msgList)
  })
}

function switchPos (pos: number) {
  if (pos >= 0) {
    renderMailbox(props.mailbox, pos)
  } else {console.log(pos)}
}

const msgContents:ThreadsContent = reactive([])
function readThread (id: string, subject: string) {
  const now = (new Date()).getTime()
  threadSubject.value = subject ? subject:nullSubject
  if (!showList.value) {
    showListInContent.value = !showListInContent.value
  }
  $globalState.jclient?.thread_get($globalState.accountId, id).then(list => {
    msgContents.length = 0
    list.forEach((item, index, array) => {
      const body:BodyMixed = []
      item.htmlBody?.forEach((value) => {
        const htmlBodyPartId = value.partId
        if (htmlBodyPartId && item.bodyValues &&
        htmlBodyPartId in item.bodyValues) {
          console.log(value.type)
          body.push({
            txt: value.type == 'text/plain' ? true: false,
            partId: htmlBodyPartId,
            value: item.bodyValues[htmlBodyPartId].value,
          })
        }
      })
      const datetime = new Date(item.receivedAt)
      msgContents.push({
        msgId: item.id,
        from: item.from && item.from.length > 0 ?  item.from[0]: {"name": "", "email": ""},
        receivedAt: fuzzyDatetime(now, datetime),
        preview: item.preview,
        body: body
      })
    })
    console.log(msgContents)
  })
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

    if (!showList.value) { // MINI STATE
      if (!showListInContent.value) {
        showListInContent.value = true
      }
    }
  }
)

const showList = ref(true)
const msglistClass = ref('msglist-full')
const showListInContent = ref(false)
function onWatch (state: number): void {
  // 首先修改 MsgList 的样式
  showList.value = state > MINI_STATE
  msglistClass.value = state == FULL_STATE ? 'msglist-full' : 'msglist-normal'

  // 其次判断 MsgContent 界面是否展示 MsgList 组件
  if (showList.value) {
    if (showListInContent.value) {
      showListInContent.value = false
    }
  } else {
    if (threadSubject.value == '') { // 此时 MsgContent 是占位内容
      showListInContent.value = true
    }
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
      :class="msglistClass" v-if="showList" />

    <div class="msgcontent">
      <MsglistView :msgList="msgList" :totalThreads="totalThreads" :paginationData="paginationData"
        @page="switchPos"
        @read="readThread"
        v-if="showListInContent" />
      <div v-else>
        <div class="thread-header">
          <span v-if="!showList"><button @click="showListInContent=!showListInContent">back</button></span>
          <span class="thread-subject">{{ threadSubject }}</span>
        </div>
        <div class="thread-email" v-for="(item, index) in msgContents" :key="item.msgId">
          <div class="thread-email-header">
            <span class="thread-email-from" :title="item.from.email">{{item.from.name}}</span>
            <span class="thread-email-date">{{item.receivedAt}}</span>
          </div>
          <div class="thread-email-content">
          <div v-for="body in item.body" :key="body.partId">
            <div v-if="body.txt"><pre v-html="body.value"></pre></div>
            <div v-else v-html="body.value"></div>
          </div>
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
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  /*height: 24px; */
  padding-left: 6px;
  margin-top: 12px;
}

.thread-subject {
  flex: 1;
  font-size: x-large;
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
}

.thread-email-from {
  font-weight: bold;
}
.thread-email-date {
  text-align: right;
  margin-left: 6px;
}
.thread-email-content {
  padding: 12px;
  font-size: small;
}
</style>
