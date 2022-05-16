<script setup lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { onMounted, computed, watch } from 'vue'
import { MINI_STATE, FULL_STATE } from '@/utils/screen';
import { $globalState } from '@/utils/global'
import { PLACEHOLDER_MAILBOXID } from '@/utils/global'

const props = defineProps<{
  widthState: number
  mailbox: string
}>()

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
        '#ids': { resultOf: '0', name: 'Email/query', path: '/ids' }
      }, '1'],
    ['Thread/get', {
        accountId: $globalState.accountId,
        '#ids': { resultOf: '1', name: 'Email/get', path: '/list/*/threadId' }
      }, '2']
    ]
  ).then(result => {
    console.log(result)
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
      foo
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

.msglist-normal {
  width: 350px;
  max-width: 350px;
}

.msglist-full {
  width: 376px;
  max-width: 380px;
}

.msgcontent {
  flex-grow: 1;
  background-color: #fefefe;
  color: #344955;
}
</style>
