import { IMailboxProperties, IMailboxSetArguments } from 'jmap-client-ts/lib/types'
import { $globalMailbox, MailboxItem } from './global'

export function fillMboxList(list: IMailboxProperties[], boxList: Array<MailboxItem>): IMailboxSetArguments {
  //https://www.iana.org/assignments/imap-mailbox-name-attributes/imap-mailbox-name-attributes.xhtml
  const roleBoxList: Array<MailboxItem> = [
    {name: 'Inbox', id: '', role: 'inbox', isSubscribed: true},
    {name: 'Drafts', id: '', role: 'drafts', isSubscribed: true},
    {name: 'Sent', id: '', role: 'sent', isSubscribed: true},
    {name: 'Trash', id: '', role: 'trash', isSubscribed: true},
    {name: 'Junk', id: '', role: 'junk', isSubscribed: true},
  ]

  const fixObj: {[id: string]: Partial<IMailboxProperties>} = {}
  const newObj: {[id: string]: Partial<IMailboxProperties>} = {}

  let noRoleBoxList: Array<IMailboxProperties> = []
  for (let box of list) {
    let matched = false
    if (box.role) {
      roleBoxList.forEach(item=>{
        if (box.role == item.role) {
          item.props = box
          item.id = box.id
          matched = true
          if (!box.isSubscribed) {
            item.props.isSubscribed = true // always true
            const patchObj: Partial<IMailboxProperties> = {isSubscribed: true}
            fixObj[box.id] = patchObj
          }
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
          role: box.role,
          isSubscribed: box.isSubscribed,
        })
      }

      $globalMailbox[box.id] = box.role
    } else {
      noRoleBoxList.push(box)
    }
  }

  roleBoxList.forEach(item => {
    if (!item.props) { // try fix knownNameMailbox
      let matched = false
      for (let box of noRoleBoxList) {
        if (box.name == item.name) {
          box.role = '' // set zero-length string from `null` as removed flag

          item.props = box
          item.props.isSubscribed = true // always true
          item.id = box.id
          console.log('%s match name %s, try set SPECIAL-USE ATTR', box.id, item.name)
          $globalMailbox[box.id] = item.role
          const patchObj: Partial<IMailboxProperties> = {role: item.role, isSubscribed: true}
          fixObj[box.id] = patchObj
          matched = true
          break
        }
      }
      if (!matched) {
        console.log('%s notfound, try auto provisioning mailbox', item.name)
        newObj[item.name] = {name: item.name, role: item.role, isSubscribed: true}
      }
    }

    boxList.push(item)
  })

  for (let box of noRoleBoxList) {
    if (box.role !== '' && box.id) { // remember `box.role = ''` ??
      boxList.push({
        name: box.name,
        id: box.id,
        props: box,
        role: '',
        isSubscribed: box.isSubscribed,
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
  const fixSpecialUSE:IMailboxSetArguments = {
    accountId: null,
  }
  if (Object.keys(fixObj).length > 0) {
    fixSpecialUSE.update = fixObj
  }
  if (Object.keys(newObj).length > 0) {
    fixSpecialUSE.create = newObj
  }
  return fixSpecialUSE
}
