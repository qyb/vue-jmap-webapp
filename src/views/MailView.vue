<script setup lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { onMounted, computed, watch, reactive, ref } from 'vue'
import { MINI_STATE, FULL_STATE } from '@/utils/screen';
import { $globalState } from '@/utils/global'
import { PLACEHOLDER_MAILBOXID } from '@/utils/global'
import { IEmailAddress } from 'jmap-client-ts/lib/types';

const props = defineProps<{
  widthState: number
  mailbox: {id: string, total: number}
}>()

const msgList: Array<{
  threadId: string
  from: IEmailAddress[]
  subject: string
  receivedAt: string
  preview: string
  seen: boolean
}> = reactive([])

function renderMailbox (mailbox: {id: string, total: number}): void {
  $globalState.jclient?.req([
    ['Email/query', {
        accountId: $globalState.accountId,
        collapseThreads: true,
        filter: { "inMailbox": mailbox.id },
        sort: [
          { property: 'receivedAt', isAscending: false }
        ],
        position: 0,
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
      msgList.push({
        threadId: item.threadId,
        from: item.from ? item.from : [],
        subject: item.subject,
        receivedAt: item.receivedAt.substring(10),
        preview: item.preview,
        seen: seen
      })
    })
    // console.log(msgList)
  })
}

const totalThreads = ref(0)

onMounted(() => {
  if (props.mailbox.id !== PLACEHOLDER_MAILBOXID) {
    console.log('dev-mode: render mailview for %s', props.mailbox.id)
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
const showList = computed((): boolean => {
  return props.widthState > MINI_STATE
})

const msglistClass = computed((): string => {
  return props.widthState == FULL_STATE ? 'msglist-full' : 'msglist-normal'
})

</script>
<template>
  <div class="mailview">
    <div :class="msglistClass" class="msglist" v-if="showList">
      <ul>
        <li v-for="item in msgList" :key="item.threadId" style="margin-top: 10px;">
          <div :style="item.seen ? 'font-weight: normal':'font-weight: bold'">
            <div>
              {{item.from[0].name}}
            </div>
            <div style="display: flex;">
              <span class="single-line">{{item.subject}}</span>
              <span>{{item.receivedAt}}</span>
            </div>
          </div>
          <div class="single-line preview">
            {{item.preview}}
          </div>
        </li>
      </ul>
      <div class="pagination" v-if="totalThreads > 50">
        placeholder
      </div>
    </div>
    <div class="msgcontent">bar</div>
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
}

.msglist ul {
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
.preview {
  font-size: small;
  color: #4A6572; /* 600 */
}
.pagination {
  border-top: 1px solid #344955;
  height: 32px;
}

.msgcontent {
  flex-grow: 1;
  background-color: #fefefe;
  color: #344955;
}
</style>
