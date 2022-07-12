<script setup lang="ts">
import { ref, reactive, onMounted, provide, readonly, computed } from 'vue'

import { useRouter } from 'vue-router'

import {
  getClientHeight, getClientWidth,
  MINI_STATE, COMPACT_STATE, NORMAL_STATE, FULL_STATE,
  MIN_FULL, MIN_NORMAL, MIN_COMPACT,
 } from '@/utils/screen';
import { IMailboxSetArguments } from 'jmap-client-ts/lib/types'
import { PLACEHOLDER_MAILBOXID, $globalState, resetGlobalState, MailboxItem, MailboxInfo } from '@/utils/global'
import { Client } from 'jmap-client-ts'
import { fillMboxList } from '@/utils/mailbox'
import { store, boxList, otherAccounts } from '@/utils/store'

const router = useRouter()

const username = ref('')
// TODO: 看起来 mailboxInfo 除了 id 还需要在模板里面做比较之外，其它的值都没啥用了...
const mailboxInfo: MailboxInfo = reactive({id: PLACEHOLDER_MAILBOXID, total: 0, accountId: null})

// default define as normalview
const folderClass = ref('folder-normal')

let folderState = true // show folder in normal/full width, control by drawer

function setStateFull () {
  if (folderState) {
    folderClass.value = 'folder-full'
  }
  store.widthState = FULL_STATE
}
function setStateNormal () {
  if (folderState) {
    folderClass.value = 'folder-normal'
  }
  store.widthState = NORMAL_STATE
}
function setStateCompact () {
  folderClass.value = 'folder-hidden'
  store.widthState = COMPACT_STATE
}
function setStateMini () {
  folderClass.value = 'folder-hidden'
  store.widthState = MINI_STATE
}

function onResize (ele: HTMLElement): void {
  // resize won't change folderState
  if (ele.offsetWidth >= MIN_FULL) {
    if (store.widthState != FULL_STATE) {
      setStateFull()
    }
  } else if (ele.offsetWidth >= MIN_NORMAL) {
    if (store.widthState != NORMAL_STATE) {
      setStateNormal()
    }
  } else if (ele.offsetWidth >= MIN_COMPACT) {
    if (store.widthState != COMPACT_STATE) {
      setStateCompact()
    }
  } else {
    if (store.widthState != MINI_STATE) {
      setStateMini()
    }
  }
}

function logout () {
  resetGlobalState()
  const myStorage = window.localStorage
  myStorage.clear()
  router.push({name: 'login'})
}

const showScreenMask = ref(false)
function drawer () {
  // 如果当前是 mini or compact, 点击 drawer 只能以浮层形式进出;
  // 如果当前是 normal or full, 点击 drawer 占据左侧宽度
  if (store.widthState < NORMAL_STATE) {
    if (folderClass.value == 'folder-hidden') {
      folderClass.value = 'folder-hidden open'
      showScreenMask.value = true
    } else {
      folderClass.value = 'folder-hidden'
      showScreenMask.value = false
    }
  } else {
    folderState = !folderState
    if (folderState) {
      folderClass.value = (store.widthState == NORMAL_STATE) ? 'folder-normal' : 'folder-full'
    } else {
      folderClass.value = 'folder-hidden'
    }
  }
}

function routerPushMail() {
  router.push({
    name: 'mail',
    query: {
      id: mailboxInfo.id,
      total: mailboxInfo.total,
      accountId: mailboxInfo.accountId,
    },
  })
}

function switchMailbox (arg: MailboxItem, accountId: string | null = $globalState.accountId): void {
  clearFocus()
  mailboxInfo.id = arg.id
  mailboxInfo.accountId = accountId
  mailboxInfo.total = arg.props?.totalThreads as number

  if (store.widthState == MINI_STATE) {
    leftInMiniUI.value = true // remove back2Left icon
  }

  routerPushMail()
}

onMounted(() => {
  const h = getClientHeight()
  const w = getClientWidth()
  console.log(`screenSize: (${w}, ${h})`)

  /**
   * mini is the same as compact for WebApp component
   * the difference between mini and compact is 2-Column Area
   */
  if (w >= MIN_FULL) {
    setStateFull()
  } else if (w >= MIN_NORMAL) {
    setStateNormal()
  } else if (w >= MIN_COMPACT) {
    setStateCompact()
  } else {
    setStateMini()
  }

  if ($globalState.jclient && $globalState.loginEmail) {
    username.value = $globalState.loginEmail
    const client: Client = $globalState.jclient.client
    client.mailbox_get({
      accountId: $globalState.accountId,
    }).then(result => {
      console.log(result)
      const fixSpecialUSE:IMailboxSetArguments = {
        accountId: $globalState.accountId,
        ifInState: result.state,
      }

      const fixObj = fillMboxList(result.list, boxList)

      if (Object.keys(fixObj).length > 0) {
        fixSpecialUSE.update = fixObj
        client.mailbox_set(fixSpecialUSE).then(response => {
          if (response.updated) {
            for (const [key, value] of Object.entries(response.updated)) {
              console.log(`Mailbox/set: ${key} success`);
            }
          }
        }).catch(error => {
          console.error(error.message)
        })
      }

      if (boxList.length > 0) {
        mailboxInfo.id = boxList[0].id
        mailboxInfo.total = boxList[0].props?.totalThreads as number
        mailboxInfo.accountId = $globalState.accountId

        routerPushMail()
      } else {
        console.error('no available mailbox')
      }

    }).catch(error => {
      console.error(error.message)
    })

    client.getAccountIds().forEach(accountId => {
      if (accountId != $globalState.accountId) {
        client.mailbox_get({
          accountId: accountId,
        }).then(result => {
          if (result.list.length > 0) {
            result.list.forEach(item => {
              otherAccounts.push({
                accountId: accountId,
                box: {
                  name: item.name,
                  id: item.id,
                  props: item,
                  role: '',
                },
              })
            })
            console.log(otherAccounts)
          }
        }).catch(error => {
          console.error(error.message)
        })
      }
    })
  } else {
    console.error('MailApp failure: %o', $globalState)
  }
})

const leftInMiniUI = ref(false)
function contextMenu(request: boolean): void {
  if (store.widthState == MINI_STATE) {
    leftInMiniUI.value = !request
  }
}

provide('contextMenu', contextMenu)
provide('leftInMiniUI',readonly(leftInMiniUI))
function back2Left(): void {
  leftInMiniUI.value = true
}

defineProps<{
  arg: string
}>()

const focusManageFolders = ref(false)
function clearFocus() {
  focusManageFolders.value = false
  mailboxInfo.id = PLACEHOLDER_MAILBOXID
}

function clickManageFolders() {
  clearFocus()
  focusManageFolders.value = true
  router.push({
    name: 'mailbox',
  })
}

const filterBoxlist = computed(() => {
  return boxList.filter(item => item.props?.isSubscribed)
})
const filterOtherAccounts = computed(() => {
  return otherAccounts.filter(item => item.box.props?.isSubscribed)
})
</script>

<template>
  <div v-layout:[arg]="onResize" class="appcontainer">
    <div class="appbar">
      <font-awesome-icon icon="bars" class="left-drawer" @click="drawer"/>
      <div class="right-edge profile" v-if="store.widthState==FULL_STATE || store.widthState==NORMAL_STATE">
        <font-awesome-icon icon="user"/>
        <div class="dropdown-profile">
          <div style="margin-bottom: 8px;">{{ username }}</div>
          <div><a @click="logout">logout</a></div>
        </div>
      </div>
      <div class="right-edge" v-else-if="store.widthState==MINI_STATE">
        <font-awesome-icon v-if="!leftInMiniUI" icon="arrow-turn-up" @click="back2Left"/>
      </div>
    </div>
    <div class="main">
      <div :class="folderClass" class="folder">
        <ul class="function-block">
          <li v-for="item in filterBoxlist" :key="item.id"
            class="list-item primary-item"
            :class="item.id === mailboxInfo.id ? 'focus-item':'normal-item'"
            @click.prevent="switchMailbox(item)"
          >
            <span>{{item.name}}</span>
            <span v-if="item.props && item.props.unreadThreads > 0"
              style="float: right;">
              ({{item.props?.unreadThreads}})
            </span>
          </li>
        </ul>

        <div v-if="otherAccounts.length > 0" class="function-block">
          <div class="secondary-block primary-item">
            Shared Accounts
          </div>
          <ul>
            <li v-for="item in filterOtherAccounts" :key="item.box.id"
              class="list-item"
              :class="item.box.id === mailboxInfo.id ? 'focus-item':'normal-item'"
              @click.prevent="switchMailbox(item.box, item.accountId)"
            >
              <span>{{ `${item.accountId}.${item.box.name}`}}</span>
              <span v-if="item.box.props && item.box.props.unreadThreads > 0"
                style="float: right;">
                ({{item.box.props?.unreadThreads}})
              </span>
            </li>
          </ul>
        </div>

        <div class="function-block">
          <div class="secondary-block primary-item">
            Settings
          </div>
          <ul>
            <li class="list-item"
              :class="focusManageFolders ? 'focus-item':'normal-item'"
              @click="clickManageFolders()"
            >
              Manage Folders
            </li>
          </ul>
        </div>

        <div v-if="store.widthState<=COMPACT_STATE" class="folder-hidden-item">
          <div class="normal-item list-item" @click="logout">logout</div>
        </div>
      </div>
      <div v-if="showScreenMask" @click="drawer" class="folder-open-mask"></div>
      <router-view></router-view>
    </div>
  </div>
</template>

<style>
/*
  Color theme:
    Primary   #344955 (Reply Blue)
    Secondary #F9AA33 (Reply Orange)
    800       #232F34
    600       #4A6572

    with Primary
    #b4c1cc (fg)
    #faab1a (highlight)

    AppBar
    #d2dbe0 (bg)
    #82929a (icon)

    MsgContent  #fefefe (grey)
    MsgList     #edf0f2
 */
.appcontainer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  height: calc(100% - 32px); /* 去掉顶部 menu 的高度 */
}

.appbar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 32px;
  background-color: #d2dbe0;
  color: #232F34;
  align-items: center;
}
.toolbar-icon {
  width: 48px;
  height: 20px;
  display: flex;
  flex-direction: column;
}
.toolbar-icon .title {
  font-size: xx-small;
  text-align: center;
}
.appbar .left-drawer {
  margin-left: 4px;
  margin-top: 4px;
  margin-bottom: 4px;
  width: 28px;
  height: 24px;
  z-index: 1; /* avoid column-toolbar override */
}
.appbar .right-edge {
  margin-right: 4px;
  margin-top: 4px;
  margin-bottom: 4px;
  width: 28px;
  height: 24px;
  z-index: 1; /* avoid column-toolbar override */
}
.profile {
  display: block;
}
.profile:hover .dropdown-profile {display: block;}
.dropdown-profile {
  display: none;
  position: absolute;
  right: 0px;
  text-align: right;
  padding: 8px;
  background-color: #d2dbe0;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
}
.dropdown-profile a {cursor: pointer;}


.folder {
  background-color: #344955;
  color: #b4c1cc;
}
.function-block {
  margin-right: 10px;
  margin-left: 10px;
  margin-top: 16px;
  margin-bottom: 16px;
}

.folder-hidden {
  position: absolute;
  z-index:1000;
  left: -198px;
  width: 198px;
  max-width: 198px;
  height: calc(100% - 32px); /* 当 Drawer 弹出时的高度 */
  transition: all 0.3s;
}
.folder-hidden.open {
  left: 0px;
}
.folder-open-mask {
  position: absolute;
  width: 100%;
  height: calc(100% - 32px); /* 当 Drawer 弹出时的高度 */
  background: rgba(0,0,0,.5);
  z-index: 500;
}

.folder-normal {
  width: 198px;
  max-width: 198px;
}

.folder-full {
  width: 214px;
  max-width: 236px;
}


.normal-item {
  /* background-color: #344955; */
  color: #b4c1cc;
}
.normal-item:hover {
  text-decoration: underline;
  color: #faab1a;
}
.focus-item {
  background-color: #faab1a;
  color: #344955;
}
.list-item {
  padding-left: 4px;
  padding-right: 4px;
  cursor: pointer;
}
.primary-item {
  height: 28px;
  line-height: 28px;
  font-size: large;
  text-align: left;
}
.folder-hidden-item {
  border-top: 2px solid #faab1a;
  margin: 10px;
  padding-top: 10px;
  text-align: left;
}

.secondary-block {
  margin-left: 4px;
  margin-bottom: 1px;
}
.function-block ul {
  margin-top: 1px;
  margin-left: 6px;
  margin-bottom: 0px;
  font-size: medium;
  margin-right: 0px;
}
</style>
