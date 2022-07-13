<script setup lang="ts">
import ResponsiveColumn from '@/components/ResponsiveColumn.vue'
import Toggle from '@vueform/toggle'
import { $globalState, MailboxItem } from '@/utils/global'
import { boxList, otherAccounts } from '@/utils/store'
import { IMailboxProperties, IMailboxSetArguments } from 'jmap-client-ts/lib/types'

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
              <Toggle v-model="item.isSubscribed" :id="item.id" :disabled="item.role!=null&&item.role!=''" @change="toggle(item, null)" />
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
                <Toggle v-model="item.box.isSubscribed" :id="item.box.id"  @change="toggle(item.box, item.accountId)"/></span>
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
