<script setup lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { onMounted, computed } from 'vue'
import { MINI_STATE, FULL_STATE } from '@/utils/screen';
import { $globalState } from '@/utils/global'

const props = defineProps<{
  widthState: number
}>()

onMounted(() => {
  console.log('MailView mounted Props.widthState:', props.widthState)
})

const showList = computed((): boolean => {
  return props.widthState > MINI_STATE
})

const msglistClass = computed((): string => {
  return props.widthState == FULL_STATE ? 'msglist-full' : 'msglist-normal'
})

function foo () {
  console.log($globalState)
}

</script>
<template>
  <div class="mailview">
    <div :class="msglistClass" class="msglist" v-if="showList">
      <a @click.prevent="foo">foo</a>
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
.msglist a {
  text-decoration: underline;
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
