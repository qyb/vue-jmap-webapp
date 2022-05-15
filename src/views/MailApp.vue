<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onMounted } from 'vue'
import {
  getClientHeight, getClientWidth,
  MINI_STATE, COMPACT_STATE, NORMAL_STATE, FULL_STATE,
  MIN_FULL, MIN_NORMAL, MIN_COMPACT,
 } from '@/utils/screen';
import MailView from './MailView.vue'
import { Client } from 'jmap-client-ts/lib'
import { XmlHttpRequestTransport } from 'jmap-client-ts/lib/utils/xml-http-request-transport'
import { IMailboxProperties } from 'jmap-client-ts/lib/types'
import { $globalState } from '@/utils/global'

const width = ref(0)
const height = ref(0)
const username = ref('')

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

const knownBoxList: Array<{
  name: string
  displayName?: string // i18n
  props?: IMailboxProperties
}> = reactive([
  {name: 'Inbox'},
  {name: 'Drafts'},
  {name: 'Sent'},
  {name: 'Trash'},
])

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

  /*
    jmapweb:main.ts 将 jmap-client-ts 又做了一层封装
    其中颇有一些值得借鉴的地方, 比如一次 HTTP 多个请求/响应的解析封装
   */
  let login = 'qyb'
  let password = 'test'
  let authorizationHeader = `Basic ${window.btoa(`${login}:${password}`)}`
  const transport = new XmlHttpRequestTransport(() => {
    let r = new XMLHttpRequest()
    return r;
  })
  const client = new Client({
    accessToken: '',
    sessionUrl: '/jmap',
    transport: transport,
    httpHeaders: {
      "Content-Type": "application/json",
      Authorization: authorizationHeader
    }
  })
  client.fetchSession().then(() => {
    let session = client.getSession()
    console.log("session: %o", session)
    $globalState.client = client
    let accountId = client.getFirstAccountId()
    username.value = session.username
    console.log(`${accountId} ${login}`)

    client.mailbox_get({ // 参考 jmapweb: Mail.svelte 参数
      accountId: null,  // null 传递进去会自动使用 getFirstAccountId
      ids: null,
    }).then(result => {
      let boxes = result.list
      for (let box of boxes) {
        knownBoxList.forEach((item, index, array) => {
          if (box.name == item.name) {
            item.props = box
          }
        })
      }
      console.log(knownBoxList)
    })
  }).catch(error => {
    // 可能是网络错误，也可能是认证失败
    console.log(error.message)
  })
})

defineProps<{
  arg: string
}>()

</script>

<template>
  <div v-layout:[arg]="onResize" class="appcontainer">
    <div class="appbar">
      <button class="btn" @click="drawer"></button>
      <div style="flex: 1;">
        MailAppViewSize: {{ width }}, {{ height }}
      </div>
      <div style="margin-right: 4px;"> {{ username }}</div>
    </div>
    <div class="main">
      <div :class="folderClass" class="folder">
        <ul>
          <li v-for="item in knownBoxList">
            {{`${item.name}(${item.props?.unreadEmails})`}}
          </li>
        </ul>
      </div>
      <MailView :widthState="layoutState.widthState" />
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

.folder-hidden {
  position: absolute;
  z-index:1000;
  box-shadow:5px 0px 10px rgba(0,0,0,.2);
  height: calc(100% - 32px); /* 去掉顶部 menu 的高度 */
  left: -198px;
  width: 198px;
  max-width: 198px;
  transition: all 0.3s;
}
.folder-hidden.open {
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
</style>
