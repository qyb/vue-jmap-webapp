<script setup lang="ts">
import { PLACEHOLDER_MAILBOXID } from '@/utils/global'
import { renderMailbox, store, msglist_id } from '@/utils/store'
import { watch, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'read', id: string, subject: string): void
  (e: 'cancelSelect'): void
}>()

const props = defineProps<{
  selectMode: boolean
}>()

watch(
  () => store.currentMbox,
  (newArg, oldArg) => {
    if (newArg.id != PLACEHOLDER_MAILBOXID) {
      renderMailbox()
    }
  }
)

function switchPos (pos: number) {
  if (pos >= 0) {
    renderMailbox(pos)
  } else {console.log(pos)}
}

function readThread (threadId: string, index: number, subject: string) {
  store.msgList[index].seen = true
  emit('read', threadId, subject)
}

function cancelSelect () {
  store.msgList.forEach(item => {
    item.checked = false
  })
  emit('cancelSelect')
}

onMounted(() => {
  /**
   * when ResponsiveColumn collapse, THIS component will be unmounted
   * from left-column, then re-mount in right-column. Therefore,
   * Reactive data, such as `msgList`, `paginationData`, should be put
   * into `store`.
   */
})
</script>
<template>
  <div class="msglist">
    <div class="minibar">
      <div v-if="selectMode" style="display: flex; justify-content: space-around;width: 100%;">
        <button @click="store.msgList.forEach(item=>{item.checked=true})">current page</button>
        <button @click="store.msgList.forEach(item=>{if(!item.seen)item.checked=true})">unread</button>
        <button @click="store.msgList.forEach(item=>{item.checked=!item.checked})">reverse</button>
        <button @click="cancelSelect()">cancel</button>
      </div>
      <div v-else>
        <input value="search..." /> <button disabled>PLACEHOLDER search</button>
      </div>
    </div>
    <ul :id="msglist_id">
      <li v-for="(item, index) in store.msgList" :key="item.threadId" style="margin-top: 10px; display: flex; align-items: center;">
        <div v-if="selectMode">
          <input type="checkbox" v-model="item.checked" />
        </div>
        <div style="flex: 1; width: 0; /* 防止被子元素撑出 */" @click="readThread(item.threadId, index, item.subject)">
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
        </div>
      </li>
    </ul>
    <div class="pagination">
      <span v-if="store.currentMbox.totalThreads > 50">
        <button @click="switchPos(store.paginationData.prevPos)" :disabled="store.paginationData.prevPos<0">prev</button>
      </span>
      <span style="flex: 1; text-align: center;">
        {{`${store.currentMbox.totalThreads > 50 ? store.paginationData.currList : ''}`}}
        {{`${store.currentMbox.totalThreads} ${store.currentMbox.totalThreads > 1 ? 'Threads':'Thread'}`}}
      </span>
      <span v-if="store.currentMbox.totalThreads > 50">
        <button @click="switchPos(store.paginationData.nextPos)" :disabled="store.paginationData.nextPos<0">next</button>
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
.minibar {
  height: 32px;
  line-height: 32px;
  padding-left: 4px;
  padding-right: 4px;
  border-bottom: 1px solid #344955;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
