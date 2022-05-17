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

// 以下两部分内容传参给 MsgList 组件
const totalThreads = ref(0)
const msgList: MessageLIST = reactive([])

const paginationData: MsgListPagination = reactive({
  prevPos: -1,
  nextPos: -1,
  currList: '',
})

function renderMailbox (mailbox: {id: string, total: number}, pos: number = 0): void {
  const now = (new Date()).getTime()
  $globalState.jclient?.req([
    ['Email/query', {
        accountId: $globalState.accountId,
        collapseThreads: true,
        filter: { "inMailbox": mailbox.id },
        sort: [
          { property: 'receivedAt', isAscending: false }
        ],
        position: pos,
        limit: 50,
        calculateTotal: true,
      }, '0'],
    ['Email/get', {
        accountId: $globalState.accountId,
        '#ids': { resultOf: '0', name: 'Email/query', path: '/ids' },
        'properties': [ "threadId", "from", "subject", "receivedAt", "preview", "keywords" ]
      }, '1'],
    //['Thread/get', {
    //    accountId: $globalState.accountId,
    //    '#ids': { resultOf: '1', name: 'Email/get', path: '/list/*/threadId' }
    //  }, '2'],
    ]
  ).then(result => {
    const list = result[1].list

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

function readThread (id: string, index: number = -1) {
  if (index >= 0) {
    msgList[index].seen = true // TODO: write seen state back
  }
  threadId.value = id
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
  }
)

const showList = ref(true)
const msglistClass = ref('msglist-full')
const showListInContent = ref(false)
function onWatch (state: number): void {
  // 首先修改 MsgList 的样式
  showList.value = state > MINI_STATE
  msglistClass.value = state == FULL_STATE ? 'msglist-full' : 'msglist-normal'

  // 其次判断 MsgContent 界面是否切换到 MsgList 组件
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
    <div :class="msglistClass" class="msglist" v-if="showList">
      <ul>
        <li v-for="(item, index) in msgList" :key="item.threadId" style="margin-top: 10px;" @click="readThread(item.threadId, index)">
          <div :style="item.seen ? 'font-weight: normal':'font-weight: bold'">
            <div class="single-line">
              {{item.from[0].name}}
            </div>
            <div class="subject-line">
              <span class="single-line">{{item.subject}}</span>
              <span class="date-line">{{item.receivedAt}}</span>
            </div>
          </div>
          <div class="single-line preview">
            {{item.preview}}
          </div>
        </li>
      </ul>
      <div class="pagination">
        <span v-if="totalThreads > 50">
          <button @click="switchPos(paginationData.prevPos)" :disabled="paginationData.prevPos<0">prev</button>
        </span>
        <span style="flex: 1;">
          {{`${totalThreads > 50 ? paginationData.currList : ''}`}}
          {{`${totalThreads} ${totalThreads > 1 ? 'Threads':'Thread'}`}}
        </span>
        <span v-if="totalThreads > 50">
          <button @click="switchPos(paginationData.nextPos)" :disabled="paginationData.nextPos<0">next</button>
        </span>
      </div>
    </div>

    <div class="msgcontent">
      <MsglistView :msgList="msgList" :totalThreads="totalThreads" :paginationData="paginationData"
        @page="switchPos"
        @read="readThread"
        v-if="showListInContent" />
      <div v-else>
        <div>ThreadsHead {{ threadId }}</div>
        <div>Threadsbody</div>
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

.msglist {
  background-color: #edf0f2;
  color: #232F34; /* 800 */
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.msglist ul {
  flex: 1;
  overflow-y: auto;
  margin-right: 0px;
  margin-left: 10px;
  margin-bottom: 4px;
  margin-top: 4px;
}
.msglist ul li {
  text-align: left;
  margin-right: 4px;
}

.msglist-normal {
  width: 350px;
  max-width: 350px;
}

.msglist-full {
  width: 376px;
  max-width: 380px;
}

.single-line {
  white-space:nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.subject-line {
  display: flex;
  justify-content: space-between;
  white-space:nowrap;
  height: 19px;
  line-height: 19px;
  font-size: small;
}
.date-line {
  text-align: right;
  font-size: x-small;
  margin-left: 6px;
}
.preview {
  font-size: x-small;
  line-height: 17px;
  color: #4A6572; /* 600 */
}
.pagination {
  border-top: 1px solid #344955;
  height: 32px;
  line-height: 32px;
  display: flex;
  justify-content: space-between;
  padding-left: 4px;
  padding-right: 4px;
}

.msgcontent {
  flex-grow: 1;
  background-color: #fefefe;
  color: #344955;
  width: 0; /* 防止被子元素撑出横向滚动条 */
}
</style>
