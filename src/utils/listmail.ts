import { IEmailAddress, IEmailProperties } from "jmap-client-ts/lib/types"
import { fuzzyDatetime } from "./common"
import { $globalMailbox, $globalState, MailboxInfo, MessageLIST, MsgListPagination, NULL_SUBJECT } from "./global"

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

export function fillMsgList (list: IEmailProperties[], mailbox: MailboxInfo, pos: number,
  msgList: MessageLIST, paginationData: MsgListPagination): void {

  let outbound = false
  if ($globalMailbox[mailbox.id] == 'sent' || $globalMailbox[mailbox.id] == 'drafts') {
    outbound = true
  }

  const now = (new Date()).getTime()

  msgList.length = 0

  list.forEach((item) => {
    let seen = false
    if (item.keywords && item.keywords.$seen) {
      seen = true
    }
    const datetime = new Date(item.receivedAt)
    msgList.push({
      threadId: item.threadId,
      // msglist_get guarantee from/to won't be null
      addr: memberOfThread(outbound,  (outbound?item.to:item.from) as IEmailAddress[]),
      subject: item.subject?item.subject:NULL_SUBJECT,
      receivedAt: fuzzyDatetime(now, datetime),
      preview: item.preview,
      seen: seen
    })
  })

  const length = list.length
  paginationData.currList = `${pos+1}-${pos+length},`
  paginationData.prevPos = pos - 50
  paginationData.nextPos = (pos + length == mailbox.total) ? -1 : pos + 50
  // console.log(msgList)
}
