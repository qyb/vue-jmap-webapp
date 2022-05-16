// import { Client } from 'jmap-client-ts/lib'
import { JClient } from '@/utils/jclient'

interface globalState {
  permission: number
  accountId: string | null
  jclient?: JClient
}

export const $globalState: globalState = {
  permission: -1,
  accountId: null
}

export function resetGlobalState(): void {
  $globalState.permission = -1
  $globalState.accountId = null
  $globalState.jclient = undefined
}

interface layoutElement {
  ele: HTMLElement
  handler: (ele: HTMLElement) => void
}

interface layoutElementMap {
  [key: string]: layoutElement
}

export const $globalLayout: layoutElementMap = {}

export const PLACEHOLDER_MAILBOXID = 'foo-bar'
