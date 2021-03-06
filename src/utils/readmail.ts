import { IEmailProperties, IEmailBodyValue } from "jmap-client-ts/lib/types";
import { ThreadContents, BodyMixed, $globalState } from "./global";
import { downloadFName } from '@/utils/common'
import {fixAddr, JAttachment} from '@/utils/jclient'

function removeElementsByTagName(doc: Document, tag: string) {
  let elements = doc.getElementsByTagName(tag)
  for (let i = 0; i < elements.length; i++) {
    elements[i].remove()
  }
}

/*
 * return value
 *   true: one or more email has RemoteResource
 *   false: only safeContent
 *
 * it's a html body filter, remove dangerous content and get ready for cid:xxxxx replacement
 */
export function fillThreadContents(list: IEmailProperties[],
  msgContents: ThreadContents, inlineBlobList: Set<string>): boolean {

  let ret = false
  const previewLength = 100

  msgContents.length = 0
  list.forEach((email, index, array) => {
    const body:BodyMixed = []
    if (email.bodyValues) {
      const bodyValues: {[bodyPartId: string]: IEmailBodyValue;} = email.bodyValues
      email.htmlBody?.forEach((value) => {
        const htmlBodyPartId = value.partId
        if (htmlBodyPartId && htmlBodyPartId in bodyValues &&
        (value.type == 'text/plain' || value.type == 'text/html')) {
          if (value.type == 'text/plain') {
            body.push({
              txt: true,
              partId: htmlBodyPartId,
              safeContent: bodyValues[htmlBodyPartId].value,
              preview: bodyValues[htmlBodyPartId].value.slice(0, previewLength)
            })
          } else {
            const parser = new DOMParser()
            const doc = parser.parseFromString(bodyValues[htmlBodyPartId].value, 'text/html')

            removeElementsByTagName(doc, 'iframe')
            removeElementsByTagName(doc, 'script')
            removeElementsByTagName(doc, 'link')
            removeElementsByTagName(doc, 'embed')

            const anchors = doc.getElementsByTagName('a')
            for (let i = 0; i < anchors.length; i++) {
              anchors[i].target = '_blank'
              anchors[i].rel = 'noopener'
            }

            const styles = doc.getElementsByTagName('style')
            for (let i = 0; i < styles.length; i++) {
              let rules = styles[i].sheet?.cssRules
              if (rules) {
                for (let j = rules.length - 1; j >= 0; j--) {
                  // console.log(rules[i].cssText)
                  // TODO: try remove unsafe css expression here
                }
              }
            }

            const images = doc.getElementsByTagName('img')
            for (let i = 0; i < images.length; i++) {
              if (images[i].src.startsWith('cid:')) {
                const cid = images[i].src.slice(4)
                email.htmlBody?.forEach(part => {
                  if (part.cid == cid && part.blobId && part.type) {
                    images[i].className = part.blobId
                    inlineBlobList.add(part.blobId + ' ' + part.type) // Set()/UNIQUE only support primitive type
                    return
                  }
                })
              } else {
                // images[i].crossOrigin = 'anonymous'
                // ??? set crossOrigin will cause CORS error ??? why ???
              }
            }

            const withRemoteResourceHTML = doc.documentElement.innerHTML

            for (let i = 0; i < images.length; i++) {
              if (!images[i].src.startsWith('cid:')) {
                images[i].src = '/block.gif'
                images[i].srcset = ''
              }
            }

            const safeContent = doc.documentElement.innerHTML

            if (safeContent != withRemoteResourceHTML) {
              ret = true // it's a global state for all emails in the thread
            }
            body.push({
              txt: false,
              partId: htmlBodyPartId,
              preview: doc.body.innerText.slice(0, previewLength),
              safeContent: safeContent,
              withRemoteResource: safeContent == withRemoteResourceHTML ? undefined : withRemoteResourceHTML
            })
          }
        }
      })
    }

    const datetime = new Date(email.receivedAt)
    const flag = email.keywords.$seen == true? true: false
    if (!email.preview) {
      if (body.length > 0) {
        email.preview = body[0].preview
      }
    }

    const attachments:JAttachment[] = []
    if (email.attachments) {
      email.attachments.forEach(attachment=>{
        let att = (attachment as unknown) as JAttachment
        if (att.disposition == 'attachment') {
          att.name = downloadFName(att.name)
          attachments.push(att)
        }
      })
    }

    msgContents.push({
      msgId: email.id,
      from: email.from && email.from.length > 0 ?  fixAddr(email.from[0]): {name: 'null name', email: 'null address'},
      receivedAt: datetime,
      $seen: flag,
      collapse: flag,
      preview: email.preview,
      attachments: attachments,
      headers: email.headers? email.headers : [],
      blobId: email.blobId,
      subject: email.subject,
      body: body
    })
  })

  return ret
}

export function replaceCID(currentAccountId: string | null, inlineBlobList: Set<string>): void {
  for (let item of inlineBlobList) {
    const inlineBlob = item.split(' ')
    const type = inlineBlob[1]
    const blobId = inlineBlob[0]

    let accountId = currentAccountId as string
    $globalState.jclient?.client.download(accountId, blobId, 'foo.bar', type).then(buffer => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const elements = document.getElementsByClassName(blobId)
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i] as HTMLImageElement
          element.src = reader.result as string
          // console.log(element.src)
        }
      }
      reader.readAsDataURL(new Blob([buffer]))
    })
  }
}
