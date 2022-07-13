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
const detailPanel = ref(false)
const newMailboxName = ref('')
const specialUse = ref(true)

const unreadEmails = ref(0)
const totalEmails = ref(0)

function showCreateForm() {
  resetState()
  createPanel.value = true
  store.focusRightColumn = true
  if (store.widthState == MINI_STATE) {
    contextMenu(true)
  }
}

let currentAccountId: string | null = null
let currentMailbox: MailboxItem | null = null
let currentServerState: string = ''
function showMailbox(mailbox: MailboxItem, accountId: string | null) {
  $globalState.jclient?.client.mailbox_get({
    accountId: accountId,
    ids: [mailbox.id],
  }).then(result => {
    currentServerState = result.state
    const props = result.list[0]
    console.log(props)
    resetState()
    detailPanel.value = true
    newMailboxName.value = props.name
    specialUse.value = (props.role !== undefined && props.role != null) || accountId != null // true if otherAccount
    unreadEmails.value = props.unreadEmails
    totalEmails.value = props.totalEmails
    currentAccountId = accountId
    currentMailbox = mailbox

    store.focusRightColumn = true
    if (store.widthState == MINI_STATE) {
      contextMenu(true)
    }
  })
}

function resetState() {
  createPanel.value = false
  detailPanel.value = false
  newMailboxName.value = ''
  specialUse.value = true
}
function clearForms() {
  resetState()
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
function renameMailbox() {
  if (!specialUse.value && currentMailbox && currentMailbox.name != newMailboxName.value) {
    $globalState.jclient?.client.mailbox_set({
      accountId: currentAccountId,
      ifInState: currentServerState,
      update: {
        [currentMailbox.id]: {
          name: newMailboxName.value,
        }
      }
    }).then(result => {
      currentServerState = result.newState
      if (result.updated && currentMailbox && result.updated[currentMailbox.id] !== undefined) {
        const id = currentMailbox.id
        if (currentAccountId == null) {
          boxList.forEach(item => {
            if (item.id == id) {
              item.name = newMailboxName.value
            }
          })
        } else {
          otherAccounts.forEach(item => {
            if (item.box.id == id) {
              item.box.name = newMailboxName.value
            }
          })
        }

        clearForms()
      }
    })
  }
}
function deleteMailbox() {
  if (!specialUse.value && currentMailbox && totalEmails.value == 0) {
    $globalState.jclient?.client.mailbox_set({
      accountId: currentAccountId,
      ifInState: currentServerState,
      destroy: [currentMailbox.id],
      // todo: onDestroyRemoveEmails
    }).then(result => {
      currentServerState = result.newState
      if (result.destroyed && currentMailbox && result.destroyed[0] == currentMailbox.id) {
        const id = currentMailbox.id
        if (currentAccountId == null) {
          boxList.forEach((item, index, array) => {
            if (id == item.id) {
              array.splice(index, 1)
              return
            }
          })
        } else {
            otherAccounts.forEach((item, index, array) => {
            if (item.box.id == id) {
              array.splice(index, 1)
              return
            }
          })
        }

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
          <li v-for="item in boxList" :key="item.id"
            class="mfolder-list-item mfolder-list-itemlayout"
          >
            <span style="flex:1; cursor: pointer;" @click="showMailbox(item, null)">{{ item.name }}</span>
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
            <li v-for="item in otherAccounts" :key="item.box.id"
              style="padding-left: 8px; " class="mfolder-list-item mfolder-list-itemlayout"
            >
              <span style="flex:1; cursor: pointer;" @click="showMailbox(item.box, item.accountId)">{{ `${item.accountId}.${item.box.name}`}}</span>
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
      <div v-if="detailPanel" style="display: flex; justify-content: space-around;">
        <div style="width: 400px; display: flex; flex-direction: column; margin-top: 30px;">
          <input v-model="newMailboxName" :disabled="specialUse" />
          <div>
            unreadEmails: {{unreadEmails}}
          </div>
          <div>
            totalEmails: {{totalEmails}}
          </div>
          <div style="display: flex; justify-content: space-around; margin-top: 12px;">
            <button @click="renameMailbox()" :disabled="specialUse">rename</button><button @click="clearForms()">cancel</button>
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
    <template v-slot:right-toolbar>
      <span v-if="!specialUse && totalEmails == 0" class="toolbar-icon" @click="deleteMailbox()">
        <font-awesome-icon icon="trash-can"/>
        <i class="title">Delete</i>
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
  overflow-y: scroll;
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
