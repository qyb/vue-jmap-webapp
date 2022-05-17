import { Client } from 'jmap-client-ts/lib'
import { IEmailQueryArguments, IEmailGetResponse, IInvocationName } from 'jmap-client-ts/lib/types'
import { Transport } from 'jmap-client-ts/lib/utils/transport';
/*
  jmapweb:main.ts 将 jmap-client-ts 又做了一层封装
  其中颇有一些值得借鉴的地方, 比如一次 HTTP 多个请求/响应的解析封装
 */

type JInvocationName = IInvocationName | 'Thread/get'
type JInvocation<ArgumentsType> = [
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

type ErrorResponse = Array<string | {"type": string}>
type JThreadQueryResponse = Array<JInvocation<IEmailGetResponse> | ErrorResponse>

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
        "Content-Type": "application/json",
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
  public req (requests: JInvocation<JThreadQueryArguments>[]): Promise<IEmailGetResponse[]> {
    const session = this.client.getSession()
    return new Promise((accept, reject) => {
      this.transport.post<{
        sessionState: string
        methodResponses: JThreadQueryResponse
      }>(session.apiUrl, {
        using: this.getCapabilities(),
        methodCalls: requests
      }, {
        "Accept": 'application/json;jmapVersion=rfc-8621',
        "Content-Type": "application/json",
        Authorization: this.accessToken == '' ?
          this.authorizationHeader : "Bearer " + this.accessToken
      }).then(value => {
        const result: Array<IEmailGetResponse> = []
        console.log('response sessionState: %s', value.sessionState)
        value.methodResponses.forEach((item, index, array) => {
          if (item[0] === 'error') {
            throw item[1]
          } else {
            result.push(item[1] as IEmailGetResponse)
          }
        })
        accept(result)
      }, reason => {
        reject(reason)
      })
    })
  }

}
