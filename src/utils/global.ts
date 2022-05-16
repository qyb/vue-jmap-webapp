import { Client } from 'jmap-client-ts/lib'

interface globalState {
  permission: number
  client?: Client
}

export const $globalState: globalState = {
  permission: -1
}

export function resetGlobalState(): void {
  $globalState.permission = -1;
  $globalState.client = undefined
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
