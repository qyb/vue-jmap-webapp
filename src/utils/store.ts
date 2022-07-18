import { reactive } from 'vue'

import { NORMAL_STATE } from '@/utils/screen'
import { MailboxItem, MailboxInfo, PLACEHOLDER_MAILBOXID, MessageLIST, MsgListPagination, $globalState } from '@/utils/global'
import { fillMsgList } from './listmail'

export const store = reactive({
  widthState: NORMAL_STATE, // default define as normalview
  currentMbox: {id: PLACEHOLDER_MAILBOXID, totalThreads: 0, accountId: null} as MailboxInfo,
  msgList: [] as MessageLIST,
  paginationData: {prevPos: -1, nextPos: -1, currList: ''} as MsgListPagination,
  trashId: '',
  junkId: '',
})

export const boxList: Array<MailboxItem> = reactive([])
export const otherAccounts: Array<{accountId: string, box: MailboxItem}> = reactive([])
export const msglist_id = 'msglist_doc_id' // use msgcontent_id to scrollTo top (0,0)
export function renderMailbox (pos: number = 0): void {
  $globalState.jclient?.msglist_get(store.currentMbox.accountId, store.currentMbox.id, pos)
  .then(list=>{
    fillMsgList(list, store.currentMbox, pos)
    document.getElementById(msglist_id)?.scrollTo(0, 0)
  })
}

export type contextMenuFunc = (request: boolean) => void
