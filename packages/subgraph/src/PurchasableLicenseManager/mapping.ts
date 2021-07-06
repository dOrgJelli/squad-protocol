import { store, Address } from "@graphprotocol/graph-ts"
import { NFTRegistered, NFTUnregistered, Purchase } 
  from '../../generated/PurchasableLicenseManager/PurchasableLicenseManager'
import { Content, PurchasableLicense, PurchaseEvent } from '../../generated/schema'

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
  let purchasableLicense = PurchasableLicense.load(
    (content.licenses as string[])[index]
  )
  // otherwise, make a new license
  if (purchasableLicense == null) {
    purchasableLicense = new PurchasableLicense(`${contentId}-${event.address}`)
    purchasableLicense.licenseManagerAddress = event.address
    purchasableLicense.content = contentId
    content.licenses.push(purchasableLicense.id)
  }
  purchasableLicense.contentOwnerWhenRegistered = event.transaction.from
  purchasableLicense.price = event.params.price
  purchasableLicense.sharePercentage = event.params.sharePercentage
  purchasableLicense.licenseTokenAddress = event.params.licenseTokenAddress
  purchasableLicense.save()
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
      store.remove('PurchasableLicense', id)
    }
  }
  content.save()
}

export function handlePurchase(event: Purchase): void {
  let purchaseEvent = new PurchaseEvent(event.transaction.hash.toHex())
  purchaseEvent.content = `${event.params.nftAddress}-${event.params.nftId}`
  purchaseEvent.purchaser = event.params.purchaser
  purchaseEvent.licensesBought = event.params.licensesBought
  purchaseEvent.pricePaid = event.params.price
  purchaseEvent.licenseTokenAddress = event.params.licenseTokenAddress
  purchaseEvent.blockNumber = event.block.number
  purchaseEvent.save()
}