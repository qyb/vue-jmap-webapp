import { Client } from 'jmap-client-ts/lib'

export declare interface globalState {
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
