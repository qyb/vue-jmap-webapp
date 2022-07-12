import { ComputedRef, reactive } from 'vue'

import { NORMAL_STATE } from '@/utils/screen'
import { MailboxItem } from '@/utils/global'

export const store = reactive({
  widthState: NORMAL_STATE, // default define as normalview
  focusRightColumn: false, // focus on right column when collapsing width
})

export const boxList: Array<MailboxItem> = reactive([])
export const otherAccounts: Array<{accountId: string, box: MailboxItem}> = reactive([])

export type contextMenuFunc = (request: boolean) => void
