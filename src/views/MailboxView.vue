<script setup lang="ts">
import ResponsiveColumn from '@/components/ResponsiveColumn.vue'
import Toggle from '@vueform/toggle'
import { $globalState, MailboxItem } from '@/utils/global'
import { boxList, otherAccounts } from '@/utils/store'
import { IMailboxProperties, IMailboxSetArguments } from 'jmap-client-ts/lib/types'
import { inject, onMounted, ref, Ref, watch } from 'vue'
import { MINI_STATE } from '@/utils/screen'
import { store } from '@/utils/store'
import type {contextMenuFunc} from '@/utils/store'
const leftInMiniUI = inject('leftInMiniUI') as Ref<boolean>
const contextMenu = inject('contextMenu') as contextMenuFunc

/**
 * primaryAccountId pass `null`
 * otherAccounts pass accountId
 */
function toggle(item: MailboxItem, accountId: string | null) {
  if (item.props && $globalState.jclient) {
    item.props.isSubscribed = item.isSubscribed
    const fixObj: {[id: string]: Partial<IMailboxProperties>} = {}
    fixObj[item.id] = {isSubscribed: item.props.isSubscribed}
    const fixreq:IMailboxSetArguments = {
      accountId: accountId,
      update: fixObj,
    }
    $globalState.jclient.client.mailbox_set(fixreq).then(response => {
      console.log(response)
    })
  }
}

const createPanel = ref(false)
const newMailboxName = ref('')
function showCreateForm() {
  createPanel.value = true
  store.focusRightColumn = true
  if (store.widthState == MINI_STATE) {
    contextMenu(true)
  }
}
function clearForms() {
  createPanel.value = false
  newMailboxName.value = ''
  store.focusRightColumn = false
  if (store.widthState == MINI_STATE) {
    contextMenu(false)
  }
}
function newMailbox() {
  let matched = false
  boxList.forEach(item => {
    if (item.name == newMailboxName.value) {
      matched = true
      return
    }
  })
  const id = 'temporaryId'
  if (!matched) {
    $globalState.jclient?.client.mailbox_set({
      accountId: null,
      create: {
        [id]: {
          name: newMailboxName.value,
        }
      }
    }).then(result => {
      if (result.created && result.created[id]) {
        /**
         * TODO: cyrus only return part of IMailboxProperties
         *  id: "foobar"
         *  isSeenShared: false
         *  isSubscribed: false
         *  showAsLabel: true
         *  sortOrder: 10
         */
        boxList.push({
          name: newMailboxName.value,
          id: result.created[id].id,
          role: '',
          props: result.created[id],
          isSubscribed: result.created[id].isSubscribed,
        })
        clearForms()
      }
    })
  }
}

onMounted(() => {
  store.focusRightColumn = false
})

watch(
  () => leftInMiniUI.value,
  (newArg, oldArg) => {
    if (newArg) {
      // click back2Left menuIcon
      clearForms()
    }
  }
)

</script>

<template>
  <ResponsiveColumn>
    <template v-slot:left>
      <div class="mfolder-list">
        <div class="mfolder-list-item mfolder-list-itemlayout" style="padding-bottom: 12px;margin-top:8px;font-size: medium;">
          <span>Mailbox</span>
          <span>isSubscribed</span>
        </div>
        <ul style="margin-top: 0px; margin-bottom: 0px;">
          <li v-for="item in boxList" :key="item.id" class="mfolder-list-item mfolder-list-itemlayout">
            <span>{{ item.name }}</span>
            <span>
              <Toggle v-model="item.isSubscribed" :id="item.id" :disabled="item.role!=''" @change="toggle(item, null)" onLabel="on" offLabel="off"/>
            </span>
          </li>
        </ul>
        <div v-if="otherAccounts.length > 0">
          <div class="mfolder-list-item" style="line-height: 28px;">
            Users
          </div>
          <ul style="margin-top: 0px; margin-bottom: 0px;">
            <li v-for="item in otherAccounts" :key="item.box.id" style="padding-left: 8px; " class="mfolder-list-item mfolder-list-itemlayout">
              <span>{{ `${item.accountId}.${item.box.name}`}}</span>
              <span>
                <Toggle v-model="item.box.isSubscribed" :id="item.box.id"  @change="toggle(item.box, item.accountId)" onLabel="on" offLabel="off"/></span>
            </li>
          </ul>
        </div>
      </div>
    </template>
    <template v-slot:right><div style="overflow-y: auto; height: 100%;">
      <div v-if="createPanel" style="display: flex; justify-content: space-around;">
        <div style="width: 400px; display: flex; flex-direction: column; margin-top: 30px;">
          <input v-model="newMailboxName" />
          <div style="display: flex; justify-content: space-around; margin-top: 12px;">
            <button @click="newMailbox()">submit</button><button @click="clearForms()">cancel</button>
          </div>
        </div>
      </div>
    </div></template>
    <template v-slot:left-toolbar>
      <span class="toolbar-icon" @click="showCreateForm()">
        <font-awesome-icon icon="folder-plus" />
        <i class="title">Create</i>
      </span>
    </template>
  </ResponsiveColumn>
</template>

<style>
@import "@vueform/toggle/themes/default.css";

.mfolder-list {
  background-color: #edf0f2;
  color: #232F34; /* 800 */
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-left: 8px;
  padding-right: 8px;
}
.mfolder-list-item {
  border-bottom: 1px solid #344955;
  height: 28px;
  text-align: left;
  font-size: small;
}
.mfolder-list-itemlayout {
  display:flex;
  justify-content: space-between;
  align-items: center;
}
</style>
