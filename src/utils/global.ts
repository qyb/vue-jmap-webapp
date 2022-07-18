import { EmailHeader, IEmailAddress, IMailboxProperties } from 'jmap-client-ts/lib/types'
import { JAttachment, JClient } from '@/utils/jclient'

interface globalState {
  permission: number
  accountId: string | null
  jclient?: JClient
  loginEmail?: string  // define VITE_DEFAULT_DOMAIN in .env.local; login or login@defaultdomain
  focusRightColumn: boolean, // focus on right column when collapsing width
}

export const $globalState: globalState = {
  permission: -1,
  accountId: null,
  focusRightColumn: false,
}

export function resetGlobalState(): void {
  $globalState.permission = -1
  $globalState.accountId = null
  $globalState.focusRightColumn = false
  $globalState.jclient = undefined
  $globalState.loginEmail = undefined
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
export const NULL_SUBJECT = '(null subject)'

export const $globalMailbox: { [mailboxId:string]: string|null} = {} // id: role
export function getMboxByRole(role: string): string | null {
  for (const [key, value] of Object.entries($globalMailbox)) {
    if (value == role) {
      return key
    }
  }
  return null
}

export declare type MessageLIST = Array<{
  threadId: string
  addr: string
  subject: string
  receivedAt: string
  preview: string
  seen: boolean
  attachments: boolean
  checked: boolean
}>
export declare type MsgListPagination = {
  prevPos: number,
  nextPos: number,
  currList: string,
}

export declare type BodyMixed = Array<{
  partId: string
  safeContent: string
  withRemoteResource?: string
  preview: string
  txt: boolean
}>
export declare type ThreadContents = Array<{
  msgId: string
  from: IEmailAddress
  receivedAt: Date
  $seen: boolean
  collapse: boolean
  preview: string
  attachments: JAttachment[]
  headers: EmailHeader[]
  blobId: string
  subject: string
  body: BodyMixed
}>
export declare type MailboxInfo = {
  id: string
  totalThreads: number
  accountId: string | null
}
export declare type MailboxItem = {
  name: string
  id: string
  role: string
  isSubscribed: boolean
  displayName?: string // i18n
  props?: IMailboxProperties
}
