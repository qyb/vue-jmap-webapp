<script setup lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { onMounted, watch, reactive, ref } from 'vue'
import { MINI_STATE, FULL_STATE } from '@/utils/screen';
import { $globalState } from '@/utils/global'
import { PLACEHOLDER_MAILBOXID, MessageLIST, MsgListPagination } from '@/utils/global'
import { fuzzyDatetime } from '@/utils/common'
import MsglistView from '@/components/MsgList.vue'

const props = defineProps<{
  widthState: number
  mailbox: {id: string, total: number}
}>()

const threadId = ref('') // 当前阅读的邮件会话

// 以下三个变量传参给 MsgList 组件
const totalThreads = ref(0)
const msgList: MessageLIST = reactive([])
const paginationData: MsgListPagination = reactive({
  prevPos: -1,
  nextPos: -1,
  currList: '',
})

function renderMailbox (mailbox: {id: string, total: number}, pos: number = 0): void {
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
        from: item.from ? item.from : [],
        subject: item.subject,
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

const body = ref('')
function readThread (id: string) {
  threadId.value = id
  if (!showList.value) {
    showListInContent.value = !showListInContent.value
  }
  $globalState.jclient?.thread_get($globalState.accountId, id).then(list => {
    console.log(list)
    const htmlBodyPartId = list[0].htmlBody[0].partId
    body.value = list[0].bodyValues[htmlBodyPartId].value
    console.log(body)
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
    if (threadId.value == '') { // 此时 MsgContent 是占位内容
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
          <span style="flex: 1;">ThreadsHead {{ threadId }}</span>
        </div>
        <div v-html="body" style="width: 100%"></div>
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
}

.thread-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 24px;
  border-bottom: 1px solid #344955;
}
</style>
