import { Client } from 'jmap-client-ts/lib'
import {
  IInvocationName,
  IReplaceableAccountId,
  IGetArguments,
  ISetArguments,
  IQueryArguments,
  IChangesArguments,
  IEmailFilterCondition,
  IEmailQueryArguments, IEmailGetArguments,
  IEmailGetResponse, IMailboxSetResponse,
  IEntityProperties, IEmailProperties, IEmailAddress, IEmailKeywords, Attachment,
} from 'jmap-client-ts/lib/types'
import { Transport } from 'jmap-client-ts/lib/utils/transport';
/*
  jmapweb:main.ts 将 jmap-client-ts 又做了一层封装
  其中颇有一些值得借鉴的地方, 比如一次 HTTP 多个请求/响应的解析封装
 */

type JInvocationName = IInvocationName | 'Thread/get'
export type JInvocation<ArgumentsType> = [
  name: JInvocationName,
  arguments: ArgumentsType,
  methodCallId: string
]

interface JEmailQueryArguments extends IEmailQueryArguments {
  collapseThreads?: boolean
  properties?: Array<string>
}
interface JThreadQueryHelper {
  accountId: string,
  '#ids': {
    resultOf: string,
    name: JInvocationName,
    path: string
  }
}
type JThreadQueryArguments = JEmailQueryArguments | JThreadQueryHelper

export type JArguments =
  | IGetArguments<IEntityProperties>  // 似乎如果直接用 IArguments 无法推导出 type|null 中的 null 类型，怀疑是 VSCode 的 bug
  | ISetArguments<IEntityProperties>
  | IQueryArguments<IEmailFilterCondition>
  | IChangesArguments
  | IEmailGetArguments                // TODO: req 只需要有一个抽象接口 IGetArguments<IEntityProperties> 就可以，将来想办法去掉这里的定义
  | JThreadQueryArguments

type ErrorResponse = Array<string | {'type': string}>
type JInvocationResponse = Array<JInvocation<IEmailGetResponse> | JInvocation<IMailboxSetResponse> | ErrorResponse>
type JResponse = IEmailGetResponse | IMailboxSetResponse

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
  transport: Transport
  authorizationHeader: string
  accessToken: string = ''

  constructor (transport: Transport, authorizationHeader: string) {
    this.transport = transport
    this.authorizationHeader = authorizationHeader
    this.client = new Client({
      accessToken: '',
      sessionUrl: '/jmap',
      transport: transport,
      httpHeaders: {
        'Content-Type': 'application/json',
        Authorization: authorizationHeader
      }
    })
  }

  public setAccessToken (arg: string): void {
    this.accessToken = arg
  }

  public getCapabilities () {
    const session = this.client.getSession()
    return session.capabilities ?
      Object.keys(session.capabilities) :
      ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail']
  }

  // TODO: 这里的 requests 和 promise 日后需要继续扩充类型定义
  public req (requests: JInvocation<JArguments>[]): Promise<JResponse[]> {
    const session = this.client.getSession()
    return new Promise((resolve, reject) => {
      this.transport.post<{
        sessionState: string
        methodResponses: JInvocationResponse
      }>(session.apiUrl, { // 相比较 jmap-client-ts 的 IRequest 类型, 这里拆解出来了
        using: this.getCapabilities(),
        methodCalls: requests // 相当于 jmap-client-ts 的 IInvocation<IArguments>[] 类型
      }, {
        Accept: 'application/json;jmapVersion=rfc-8621',
        'Content-Type': 'application/json',
        Authorization: this.accessToken == '' ?
          this.authorizationHeader : 'Bearer ' + this.accessToken
      }).then(value => {
        const result: Array<JResponse> = []
        // console.log('response sessionState: %s', value.sessionState)
        value.methodResponses.forEach((item, index, array) => {
          if (item[0] === 'error') {
            throw item[1]
          } else {
            result.push(item[1] as JResponse)
          }
        })
        resolve(result)
      }, reason => {
        reject(reason)
      })
    })
  }

  public msglist_get (accountId: string|null, mailboxId: string, pos: number): Promise<IEmailProperties[]> {
    return new Promise((resolve, reject) => {
      this.req([
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
      }, reason => {
        reject(reason)
      })
    })
  }

  public thread_get (accountId: string|null, threadId: string): Promise<IEmailProperties[]> {
    return new Promise((resolve, reject) => {
      this.req([
        ['Thread/get', {
          accountId: accountId,
          ids: [threadId]
        }, '0'],
        ['Email/get', {
          accountId: accountId,
          '#ids': {
            name: 'Thread/get',
            path: '/list/*/emailIds',
            resultOf: '0'
          },
          properties: [ 'threadId', 'mailboxIds', 'from', 'subject', 'keywords', 'preview', 'attachments',
            'receivedAt', 'header:List-POST:asURLs',
            'htmlBody', 'bodyValues'],
          bodyProperties: [ 'partId', 'blobId', 'size', 'type', 'cid',
            'name', /* for attachment download */
            'disposition' /* for attachment flag  */ ],
          fetchHTMLBodyValues: true,
        }, '1']
      ]).then(value => {
        const response = value[1] as IEmailGetResponse
        resolve(response.list)
      }, reason => {
        reject(reason)
      })
    })
  }

  public blob_data (url: string): Promise<Response> {
    return fetch(url, {
      headers: {
        Authorization: this.accessToken == '' ?
        this.authorizationHeader : 'Bearer ' + this.accessToken
      }
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
