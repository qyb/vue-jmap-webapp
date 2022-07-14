import { IEmailAddress, IEmailProperties } from "jmap-client-ts/lib/types"
import { fuzzyDatetime } from "./common"
import { $globalMailbox, $globalState, MailboxInfo, NULL_SUBJECT } from "./global"
import { store } from "./store"

function memberOfThread(outbound: boolean, addrList: IEmailAddress[]): string {
  let addr:string[] = []
  let addrSet = new Set([$globalState.loginEmail])
  addrList.forEach((item) => {
    if (!addrSet.has(item.email)) { // skip myself addr.
      addr.push(item.name)
      addrSet.add(item.email)
    }
  })

  return (outbound?'Recipient: ':'') + addr.join(',')
}

export function fillMsgList (list: IEmailProperties[], mailbox: MailboxInfo, pos: number): void {

  let outbound = false
  if ($globalMailbox[mailbox.id] == 'sent' || $globalMailbox[mailbox.id] == 'drafts') {
    outbound = true
  }

  const now = (new Date()).getTime()

  store.msgList.length = 0

  list.forEach((item) => {
    let seen = false
    let attachments = false
    if (item.keywords && item.keywords.$seen) {
      seen = true
    }
    if (item.attachments && item.attachments.length > 0) {
      attachments = true
    }
    const datetime = new Date(item.receivedAt)
    store.msgList.push({
      threadId: item.threadId,
      // msglist_get guarantee from/to won't be null
      addr: memberOfThread(outbound,  (outbound?item.to:item.from) as IEmailAddress[]),
      subject: item.subject?item.subject:NULL_SUBJECT,
      receivedAt: fuzzyDatetime(now, datetime),
      preview: item.preview,
      seen: seen,
      attachments: attachments,
      checked: false,
    })
  })

  const length = list.length
  store.paginationData.currList = `${pos+1}-${pos+length},`
  store.paginationData.prevPos = pos - 50
  store.paginationData.nextPos = (pos + length == mailbox.totalThreads) ? -1 : pos + 50
}
