<script setup lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { onMounted, computed, watch } from 'vue'
import { MINI_STATE, FULL_STATE } from '@/utils/screen';
import { $globalState } from '@/utils/global'

const props = defineProps<{
  widthState: number
  mailbox: string
}>()

function renderMailbox (id: string): void {
  $globalState.client?.email_query({
    accountId: null,
    filter: {
      "inMailbox": id
    },
    "sort": [
        { "property": "receivedAt", "isAscending": false }
    ],
    "position": 0,
    "limit": 10,
    "calculateTotal": true
  }).then(result => {
    console.log(result)
  })
}
onMounted(() => {
  if (props.mailbox !== 'foo-bar') {
    console.log('dev-mode: render mailview for %s', props.mailbox)
    renderMailbox(props.mailbox)
  }
  // console.log('MailView mounted mailbox:', props.mailbox, $globalState.client)
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
