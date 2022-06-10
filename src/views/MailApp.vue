<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import {
  getClientHeight, getClientWidth,
  MINI_STATE, COMPACT_STATE, NORMAL_STATE, FULL_STATE,
  MIN_FULL, MIN_NORMAL, MIN_COMPACT,
 } from '@/utils/screen';
import MailView from './MailView.vue'
import { IMailboxSetArguments } from 'jmap-client-ts/lib/types'
import { PLACEHOLDER_MAILBOXID, $globalState, resetGlobalState, MailboxItem } from '@/utils/global'
import { Client } from 'jmap-client-ts'
import { fillMboxList } from '@/utils/mailbox'

const router = useRouter()

const width = ref(0)
const height = ref(0)
const username = ref('')
const mailboxInfo = reactive({id: PLACEHOLDER_MAILBOXID, total: 0})

// default define as normalview
const layoutState = {
  widthState: NORMAL_STATE,
  folderState: true, // false: 手动隐藏
}
const folderClass = ref('folder-normal')

function setStateFull () {
  if (layoutState.folderState) {
    folderClass.value = 'folder-full'
  }
  layoutState.widthState = FULL_STATE
}
function setStateNormal () {
  if (layoutState.folderState) {
    folderClass.value = 'folder-normal'
  }
  layoutState.widthState = NORMAL_STATE
}
function setStateCompact () {
  folderClass.value = 'folder-hidden'
  layoutState.widthState = COMPACT_STATE
}
function setStateMini () {
  folderClass.value = 'folder-hidden'
  layoutState.widthState = MINI_STATE
}

function onResize (ele: HTMLElement): void {
  // resize 事件不改动 layoutState.folderState 的值
  width.value = ele.offsetWidth,
  height.value = ele.offsetHeight

  if (width.value >= MIN_FULL) {
    if (layoutState.widthState != FULL_STATE) {
      setStateFull()
    }
  } else if (width.value >= MIN_NORMAL) {
    if (layoutState.widthState != NORMAL_STATE) {
      setStateNormal()
    }
  } else if (width.value >= MIN_COMPACT) {
    if (layoutState.widthState != COMPACT_STATE) {
      setStateCompact()
    }
  } else {
    if (layoutState.widthState != MINI_STATE) {
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

function drawer () {
  // 如果当前是 mini or compact, 点击 drawer 只能以浮层形式进出;
  // 如果当前是 normal or full, 点击 drawer 占据左侧宽度
  if (layoutState.widthState < NORMAL_STATE) {
    if (folderClass.value == 'folder-hidden') {
      folderClass.value = 'folder-hidden open'
    } else {
      folderClass.value = 'folder-hidden'
    }
  } else {
    layoutState.folderState = !layoutState.folderState
    if (layoutState.folderState) {
      folderClass.value = (layoutState.widthState == NORMAL_STATE) ? 'folder-normal' : 'folder-full'
    } else {
      folderClass.value = 'folder-hidden'
    }
  }
}

function switchMailbox (arg: MailboxItem): void {
  mailboxInfo.id = arg.id
  mailboxInfo.total = arg.props?.totalThreads as number
}

const boxList: Array<MailboxItem>  = reactive([])

onMounted(() => {
  const h = getClientHeight()
  const w = getClientWidth()
  console.log(`screenSize: (${w}, ${h})`)

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
      ids: null,
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
      } else {
        console.error('no available mailbox')
      }

    }).catch(error => {
      console.error(error.message)
    })
  } else {
    console.error('MailApp failure: %o', $globalState)
  }
})

defineProps<{
  arg: string
}>()

</script>

<template>
  <div v-layout:[arg]="onResize" class="appcontainer">
    <div class="appbar">
      <font-awesome-icon icon="bars" class="btn" @click="drawer"/>
      <div style="flex: 1;">
        MailAppViewSize: {{ width }}, {{ height }}
      </div>
      <div style="margin-right: 4px; cursor: pointer;">
        <a @click="logout">logout({{ username }})</a>
      </div>
    </div>
    <div class="main">
      <div :class="folderClass" class="folder">
        <ul>
          <li v-for="item in boxList" :key="item.id"
            class="list-item"
            :class="item.id === mailboxInfo.id ? 'focus-item':'normal-item'"
            style="cursor: pointer;"
            @click.prevent="switchMailbox(item)"
          >
            <span>{{item.name}}</span>
            <span v-if="item.props && item.props.unreadThreads > 0"
              style="float: right;">
              ({{item.props?.unreadThreads}})
            </span>
          </li>
        </ul>
      </div>
      <MailView :widthState="layoutState.widthState" :mailbox="mailboxInfo" />
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
.appbar .btn {
  margin-left: 4px;
  margin-top: 4px;
  margin-bottom: 4px;
  width: 28px;
  height: 24px;
}

.folder {
  background-color: #344955;
  color: #b4c1cc;
}
.folder ul {
  margin-right: 10px;
  margin-left: 10px;
}

.folder-hidden {
  position: absolute;
  z-index:1000;
  box-shadow:5px 0px 10px rgba(0,0,0,.2);
  left: -198px;
  width: 198px;
  max-width: 198px;
  height: calc(100% - 32px); /* 当 Drawer 弹出时的高度 */
  transition: all 0.3s;
}
.folder-hidden.open {
  height: calc(100% - 32px); /* 当 Drawer 弹出时的高度 */
  left: 0px;
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
  background-color: #344955;
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
  height: 28px;
  line-height: 28px;
  font-size: large;
  padding-left: 4px;
  padding-right: 4px;
}
</style>
