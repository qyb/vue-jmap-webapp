<script setup lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { onMounted, computed, watch, reactive } from 'vue'
import { MINI_STATE, FULL_STATE } from '@/utils/screen';
import { $globalState } from '@/utils/global'
import { PLACEHOLDER_MAILBOXID } from '@/utils/global'
import { IEmailAddress } from 'jmap-client-ts/lib/types';

const props = defineProps<{
  widthState: number
  mailbox: string
}>()

const msgList: Array<{
  threadId: string
  from: IEmailAddress[]
  subject: string
  receivedAt: string
  preview: string
  seen: boolean
}> = reactive([])
function renderMailbox (id: string): void {
  $globalState.jclient?.req([
    ['Email/query', {
        accountId: $globalState.accountId,
        collapseThreads: true,
        filter: { "inMailbox": id },
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

onMounted(() => {
  if (props.mailbox !== PLACEHOLDER_MAILBOXID) {
    console.log('dev-mode: render mailview for %s', props.mailbox)
    renderMailbox(props.mailbox)
  }
})

watch(
  ()=>props.mailbox,
  (newId, oldId) => {
    renderMailbox(newId)
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
          <div class="single-line">
            {{item.preview}}
          </div>
        </li>
      </ul>
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
  color: #344955;
}
.msglist ul li {
  text-align: left;
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

.msgcontent {
  flex-grow: 1;
  background-color: #fefefe;
  color: #344955;
}
</style>
