import { store, Address } from "@graphprotocol/graph-ts"
import { NFTRegistered, NFTUnregistered } 
  from '../../generated/RevShareLicenseManager/RevShareLicenseManager'
import { Content, RevShareLicense } from '../../generated/schema'

export function handleNFTRegistered(event: NFTRegistered): void {
  const contentId = `${event.params.nftAddress}-${event.params.nftId}`
  let content = Content.load(contentId)
  if (content == null) {
    content = new Content(contentId)
  }
  content.nftAddress = event.params.nftAddress
  content.nftId = event.params.nftId
  // if this content already has a license registered w/ this manager, load it and replace the values
  let index = content.licenses.findIndex((id): boolean => {
    return Address.fromString(id.split('-')[1]) == event.address
  })
  let revShareLicense = RevShareLicense.load(
    (content.licenses as string[])[index]
  )
  // otherwise, make a new license
  if (revShareLicense == null) {
    revShareLicense = new RevShareLicense(`${contentId}-${event.address}`)
    revShareLicense.licenseManagerAddress = event.address
    revShareLicense.content = contentId
    content.licenses.push(revShareLicense.id)
  }
  revShareLicense.contentOwnerWhenRegistered = event.transaction.from
  revShareLicense.minSharePercentage = event.params.minSharePercentage
  revShareLicense.save()
  content.save()
}

export function handleNFTUnregistered(event: NFTUnregistered): void {
  const contentId = `${event.params.nftAddress}-${event.params.nftId}`
  let content = Content.load(contentId)
  if (content == null) {
    return
  }
  // if this content already has a license registered w/ this manager, splice it out and remove it
  let licenses = content.licenses as string[]
  for (let i = 0; i < licenses.length; i++) {
    let id = licenses[i]
    let address = Address.fromString(id.split('-')[1])
    if (address == event.address) {
      content.licenses.splice(i, 1)
      store.remove('RevShareLicense', id)
    }
  }
  content.save()
}