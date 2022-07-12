import { reactive } from 'vue'
import type { InjectionKey } from 'vue'

import { NORMAL_STATE } from '@/utils/screen'

export const store = reactive({
  widthState: NORMAL_STATE, // default define as normalview
  focusRightColumn: false, // focus on right column when collapsing width
})

export type contextMenuFunc = (request: boolean) => void
