<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { $globalState } from '@/utils/global'
import { Client } from 'jmap-client-ts/lib'
import { XmlHttpRequestTransport } from 'jmap-client-ts/lib/utils/xml-http-request-transport'
const transport = new XmlHttpRequestTransport(() => {
  let r = new XMLHttpRequest()
  return r;
})

const router = useRouter()
const route = useRoute()
const login = ref('')
const password = ref('')
function submit () {
  /*
    jmapweb:main.ts 将 jmap-client-ts 又做了一层封装
    其中颇有一些值得借鉴的地方, 比如一次 HTTP 多个请求/响应的解析封装
   */
  let authorizationHeader = `Basic ${window.btoa(`${login.value}:${password.value}`)}`
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
    let accountId = client.getFirstAccountId()

    let accountCapabilities = session.accounts[accountId].accountCapabilities
    console.log("Account Capabilities: %s %o", accountId, accountCapabilities)
    if (null === accountCapabilities) {
      throw new Error("null capabilities!");
    }

    $globalState.client = client
    $globalState.permission = 0
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
</script>
<template>
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
</template>
