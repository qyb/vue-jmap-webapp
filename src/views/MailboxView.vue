<script setup lang="ts">
import ResponsiveColumn from '@/components/ResponsiveColumn.vue'
import { $globalState, MailboxItem } from '@/utils/global'
import { boxList, otherAccounts } from '@/utils/store'
import { IMailboxProperties, IMailboxSetArguments } from 'jmap-client-ts/lib/types'

/**
 * primaryAccountId pass `null`
 * otherAccounts pass accountId
 */
function toggle(item: MailboxItem, accountId: string | null) {
  if (item.props && $globalState.jclient) {
    console.log(item.props.role)
    if (item.props.role == null || accountId) {
      item.props.isSubscribed = !item.props.isSubscribed
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
}
</script>

<template>
  <ResponsiveColumn>
    <template v-slot:left>
      <div class="mfolder-list">
        <ul style="margin-top: 0px; margin-bottom: 0px;">
          <li v-for="item in boxList" :key="item.id" style="border-bottom: 1px solid #344955; display: flex; justify-content: space-between;">
            <span>{{ item.name }}</span>
            <span @click="toggle(item, null)">{{ item.props?.isSubscribed }}</span>
          </li>
        </ul>
        <div v-if="otherAccounts.length > 0">
          <div style="border-bottom: 1px solid #344955; text-align: left;">
            Users
          </div>
          <ul style="margin-top: 0px; margin-bottom: 0px;">
            <li v-for="item in otherAccounts" :key="item.box.id" style="border-bottom: 1px solid #344955; display: flex; justify-content: space-between; padding-left: 8px;">
              <span>{{ `${item.accountId}.${item.box.name}`}}</span>
              <span @click="toggle(item.box, item.accountId)">{{ item.box.props?.isSubscribed }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
    <template v-slot:right><div style="overflow-y: auto; height: 100%;">
      bar
    </div></template>
    <template v-slot:left-toolbar>
      <span class="toolbar-icon">
        <font-awesome-icon icon="folder-plus" />
        <i class="title">Create</i>
      </span>
    </template>
  </ResponsiveColumn>
</template>

<style>
.mfolder-list {
  background-color: #edf0f2;
  color: #232F34; /* 800 */
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
