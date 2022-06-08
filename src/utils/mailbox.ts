import { IMailboxProperties } from 'jmap-client-ts/lib/types'
import { $globalMailbox, MailboxItem } from './global'

export function fillMboxList(list: IMailboxProperties[], boxList: Array<MailboxItem>): {[id: string]: Partial<IMailboxProperties>} {
  //https://www.iana.org/assignments/imap-mailbox-name-attributes/imap-mailbox-name-attributes.xhtml
  const roleBoxList: Array<MailboxItem> = [
    {name: 'Inbox', id: '', role: 'inbox'},
    {name: 'Drafts', id: '', role: 'drafts'},
    {name: 'Sent', id: '', role: 'sent'},
    {name: 'Trash', id: '', role: 'trash'},
    {name: 'Junk', id: '', role: 'junk'},
  ]

  let noRoleBoxList: Array<IMailboxProperties> = []
  for (let box of list) {
    let matched = false
    if (box.role) {
      roleBoxList.forEach(item=>{
        if (box.role == item.role) {
          item.props = box
          item.id = box.id
          matched = true
          return
        }
      })

      if (!matched) {
        // expand our roleBoxList
        console.log('%s(%s) unknown role %s', box.name, box.id, box.role)
        roleBoxList.push({
          name: box.name,
          id: box.id,
          props: box,
          role: box.role
        })
      }

      $globalMailbox[box.id] = box.role
    } else {
      noRoleBoxList.push(box)
    }
  }

  const fixObj: {[id: string]: Partial<IMailboxProperties>} = {}
  roleBoxList.forEach(item => {
    if (!item.props) { // try fix knownNameMailbox
      for (let box of noRoleBoxList) {
        if (box.name == item.name) {
          box.role = '' // set zero-length string from `null` as removed flag

          item.props = box
          item.id = box.id
          console.log('%s match name %s, try set SPECIAL-USE ATTR', box.id, item.name)
          $globalMailbox[box.id] = item.role
          const patchObj: Partial<IMailboxProperties> = {role: item.role}
          fixObj[box.id] = patchObj
          break
        }
      }
    }
    if (item.id) { // corrupt cyrus mailboxes.db may return ''
      boxList.push(item)
    }
  })

  for (let box of noRoleBoxList) {
    if (box.role !== '' && box.id) { // remember `box.role = ''` ??
      boxList.push({
        name: box.name,
        id: box.id,
        props: box,
        role: '',
      })
      if (box.name == 'Sent Items') { //fix outlook client, it will not affect backend
        $globalMailbox[box.id] = 'sent'
      } else if (box.name == 'Deleted Items') { //fix outlook client, it will not affect backend
        $globalMailbox[box.id] = 'trash'
      } else {
        $globalMailbox[box.id] = null
      }
    }
  }

  console.log($globalMailbox)
  return fixObj
}
