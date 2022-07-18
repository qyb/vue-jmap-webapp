import { Client } from 'jmap-client-ts/lib'
import {
  IEmailGetResponse,
  IEmailProperties, IEmailAddress, IEmailKeywords,
  Attachment,
} from 'jmap-client-ts/lib/types'
import { Transport } from 'jmap-client-ts/lib/utils/transport'

/**
 * TODO pull request.  should remove 'accept: application/json' header
 *  1. download
 *  2. attachment
 */
export interface JAttachment {
  partId: string
  blobId: string
  size: number
  name: string
  type: string
  disposition: string
}

export class JClient {
  client: Client
  authorizationHeader: string
  accessToken: string = ''

  constructor (transport: Transport, authorizationHeader: string, sessionUrl: string = '/.well-known/jmap') {
    this.authorizationHeader = authorizationHeader
    this.client = new Client({
      sessionUrl: sessionUrl,
      accessToken: '',
      transport: transport,
      httpHeaders: {
        'Content-Type': 'application/json',
        Authorization: authorizationHeader
      }
    })
  }

  public msglist_get (accountId: string|null, mailboxId: string, pos: number): Promise<IEmailProperties[]> {
    return new Promise((resolve, reject) => {
      this.client.limitedMethods([
        // First we do a query for the id of first N messages in the mailbox
        ['Email/query', {
          accountId: accountId,
          collapseThreads: true,
          filter: { inMailbox: mailboxId },
          sort: [
            { property: 'receivedAt', isAscending: false }
          ],
          position: pos,
          limit: 50,
          calculateTotal: true,
        }, '0'],

        // Then we fetch the threadId/Subject/ReceivedAt of each of those messages
        // we don't need from/to here
        ['Email/get', {
          accountId: accountId,
          '#ids': { resultOf: '0', name: 'Email/query', path: '/ids' },
          properties: [ 'threadId', 'subject', 'receivedAt', 'preview' ]
        }, '1'],

        // Next we get the emailIds of the messages in those threads
        ['Thread/get', {
          accountId: accountId,
          '#ids': { resultOf: '1', name: 'Email/get', path: '/list/*/threadId' }
        }, '2'],

        // Finally we get From/To Addresses for MsgList's sender-column,  iterate all $seen state to set Thread $seen state
        ['Email/get', {
          accountId: accountId,
          '#ids': { resultOf: '2', name: 'Thread/get', path: '/list/*/emailIds' },
          properties: ['from', 'threadId', 'to', 'keywords', 'attachments']
        }, '3']
      ]).then(value => {
        const response = value[1] as IEmailGetResponse
        const allList = value[3] as IEmailGetResponse
        response.list.forEach((thread) => {
          const fromAddr: IEmailAddress[] = []
          const toAddr: IEmailAddress[] = []
          const kw: IEmailKeywords = { '$seen': true}
          const attachments: Attachment[] = []
          allList.list.forEach((item) => {
            if (thread.threadId == item.threadId) {
              if (item.from && item.from.length > 0) {
                const addr = item.from[0]
                // NOTE `name` may be null, jmap-client-ts's IEmailAddress is wrong...
                fromAddr.push(fixAddr(addr))
              }

              if (item.to) {
                item.to.forEach(addr=>{
                  toAddr.push(fixAddr(addr))
                })
              }

              if (!(item.keywords && item.keywords.$seen)) {
                kw.$seen = undefined
              }


              if (item.attachments && attachments.length == 0) {
                item.attachments.forEach(attachment=>{
                  let att = (attachment as unknown) as JAttachment
                  if (att.disposition == 'attachment') {
                    attachments.push(attachment)
                  }
                })
              }
            }
          })
          thread.from = fromAddr
          thread.to = toAddr
          thread.keywords = kw
          thread.attachments = attachments
        })
        resolve(response.list)
      })
    })
  }

  public getEmailPropsByThreadIds (
  accountId: string|null,
  ids: string[],
  args: {
    properties: (keyof IEmailProperties)[],
    bodyProperties?: string[],
    fetchTextBodyValues?: boolean,
    fetchHTMLBodyValues?: boolean,
    fetchAllBodyValues?: boolean,
    maxBodyValueBytes?: number
  }): Promise<IEmailProperties[]> {
    return new Promise((resolve, reject) => {
      this.client.limitedMethods([
        ['Thread/get', {
          accountId: accountId,
          ids: ids
        }, '0'],
        ['Email/get', {
          accountId: accountId,
          '#ids': {
            name: 'Thread/get',
            path: '/list/*/emailIds',
            resultOf: '0'
          },
          properties: args.properties,
          bodyProperties: args.bodyProperties,
          fetchTextBodyValues: args.fetchTextBodyValues,
          fetchHTMLBodyValues: args.fetchHTMLBodyValues,
          fetchAllBodyValues: args.fetchAllBodyValues,
          maxBodyValueBytes: args.maxBodyValueBytes
        }, '1']
      ]).then(value => {
        const response = value[1] as IEmailGetResponse
        resolve(response.list)
      })
    })
  }

  public thread_get (accountId: string|null, threadId: string): Promise<IEmailProperties[]> {
    return this.getEmailPropsByThreadIds(accountId, [threadId], {
      properties: [ 'blobId', 'threadId', 'mailboxIds', 'from', 'subject', 'keywords', 'preview', 'attachments',
        'receivedAt', 'headers',
        'htmlBody', 'bodyValues'],
      bodyProperties: [ 'partId', 'blobId', 'size', 'type', 'cid',
        'name', /* for attachment download */
        'disposition' /* for attachment flag  */ ],
      fetchHTMLBodyValues: true
    })
  }
}

export function fixAddr(addr: IEmailAddress): IEmailAddress {
  if (addr.name) {
    return {
      name: addr.name,
      email: addr.email
    }
  } else {
    return({
      name: addr.email.split('@')[0],
      email: addr.email
    })
  }
}
