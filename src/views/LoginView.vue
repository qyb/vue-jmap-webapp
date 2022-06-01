<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { $globalState } from '@/utils/global'
import { JClient } from '@/utils/jclient'
import { XmlHttpRequestTransport } from 'jmap-client-ts/lib/utils/xml-http-request-transport'
const transport = new XmlHttpRequestTransport(() => {
  let r = new XMLHttpRequest()
  return r;
})

const router = useRouter()
const route = useRoute()
const login = ref('')
const password = ref('')
const tips = ref('')

function fetchSession (authorizationHeader: string, isSubmit: boolean): void {
  const jclient = new JClient(transport, authorizationHeader)
  jclient.client.fetchSession().then(() => {
    let session = jclient.client.getSession()
    let accountId = jclient.client.getFirstAccountId()

    let accountCapabilities = session.accounts[accountId].accountCapabilities
    console.log("Account Capabilities: %s %o", accountId, accountCapabilities)
    if (null === accountCapabilities) {
      throw new Error("null capabilities!");
    }

    if (isSubmit) { // LoginSubmit success, save localStorage
      const myStorage = window.localStorage
      myStorage.setItem('Authorization', authorizationHeader)
    } else {
      console.log('fetch session from localStorage')
    }

    $globalState.jclient = jclient
    $globalState.permission = 0
    $globalState.accountId = accountId

    let redirect = route.query?.redirect as string
    let path = redirect ? redirect:'/app/mail'
    if (path == '/app/mail') {
      router.push({
        name: 'mail',
        params: {'arg': 'mail'}
      })
    } else {
      router.push({path: path})
    }
  }).catch(error => {
    console.error(error.message)
  })
}

function submit () {
  let authorizationHeader = `Basic ${window.btoa(`${login.value}:${password.value}`)}`
  fetchSession(authorizationHeader, true)
}

onMounted(() => {
  // 尝试读取当前的 localStorage 看看是不是登录信息合法
  const myStorage = window.localStorage
  const authorizationHeader = myStorage.getItem('Authorization')
  if (authorizationHeader) {
    fetchSession(authorizationHeader, false)
  }
  if (import.meta.env.MODE == 'demo') {
    tips.value = 'Demo Account: inbox@rubyfish.app, Password: inbox'
  } else if (import.meta.env.MODE == 'development') {
    tips.value = 'development site'
  }
})
</script>
<template>
  <div>
    <div>
      <form @submit.prevent="submit">
        <p>
          LoginName: <input type="text" v-model="login" />
        </p>
        <p>
          Password: <input type="password" v-model="password" />
        </p>
        <p>
          <input type="submit" />
        </p>
      </form>
    </div>
    <div>
      {{ tips }}
    </div>
  </div>
</template>
