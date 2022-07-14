import { reactive } from 'vue'

import { NORMAL_STATE } from '@/utils/screen'
import { MailboxItem, MailboxInfo, PLACEHOLDER_MAILBOXID, MessageLIST, MsgListPagination } from '@/utils/global'

export const store = reactive({
  widthState: NORMAL_STATE, // default define as normalview
  currentMbox: {id: PLACEHOLDER_MAILBOXID, totalThreads: 0, accountId: null} as MailboxInfo,
  msgList: [] as MessageLIST,
  paginationData: {prevPos: -1, nextPos: -1, currList: ''} as MsgListPagination,
})

export const boxList: Array<MailboxItem> = reactive([])
export const otherAccounts: Array<{accountId: string, box: MailboxItem}> = reactive([])

export type contextMenuFunc = (request: boolean) => void
