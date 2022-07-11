<script setup lang="ts">
import { MessageLIST, MsgListPagination } from '@/utils/global'
/*
  基本思路是，网络操作在父组件进行
  即: emit->MailView->props/MsgList
 */
const emit = defineEmits<{
  (e: 'read', id: string, subject: string): void
  (e: 'page', pos: number): void
}>()

const props = defineProps<{
  msgList: MessageLIST
  totalThreads: number
  paginationData: MsgListPagination
}>()

function switchPos (pos: number) {
  if (pos >= 0) {
    emit('page', pos)
  } else {console.log(pos)}
}

function readThread (id: string, index: number, subject: string) {
  props.msgList[index].seen = true // TODO: write seen state back
  emit('read', id, subject)
}
</script>
<template>
  <div class="msglist">
    <ul>
      <li v-for="(item, index) in msgList" :key="item.threadId" style="margin-top: 10px;" @click="readThread(item.threadId, index, item.subject)">
        <div :style="item.seen ? 'font-weight: normal':'font-weight: bold'">
          <div class="single-line">
            {{item.addr}}
          </div>
          <div class="subject-line">
            <span class="single-line"><font-awesome-icon v-if="item.attachments" icon="paperclip" />{{item.subject}}</span>
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
      <span style="flex: 1; text-align: center;">
        {{`${totalThreads > 50 ? paginationData.currList : ''}`}}
        {{`${totalThreads} ${totalThreads > 1 ? 'Threads':'Thread'}`}}
      </span>
      <span v-if="totalThreads > 50">
        <button @click="switchPos(paginationData.nextPos)" :disabled="paginationData.nextPos<0">next</button>
      </span>
    </div>
  </div>
</template>

<style>
.msglist {
  background-color: #edf0f2;
  color: #232F34; /* 800 */
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%; /* 作为 msgcontent 的子元素必须有这个 */
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
</style>
