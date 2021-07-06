import { BigInt } from "@graphprotocol/graph-ts"
import { WindowIncremented, TransferToken } from '../../generated/Royalties/Royalties'
import { Royalties, Window, Transfer } from '../../generated/schema'

export function handleWindowIncremented(event: WindowIncremented): void {
  let royalties = Royalties.load('0')
  if (royalties == null) {
    royalties = new Royalties('0')
  }
  royalties.totalClaimableBalance = event.params.totalClaimableBalance
  royalties.save()

  // TODO weird that we have to do this minus 1 here -- worth changing?
  let windowIndex = event.params.currentWindow.minus(new BigInt(1))
  let window = new Window(windowIndex.toHex())
  window.index = windowIndex
  window.fundsAvailable = event.params.fundsAvailable
  window.merkleRoot = event.params.merkleRoot
  window.blockNumber = event.block.number
  window.save()
}

export function handleTransferToken(event: TransferToken): void {
  let royalties = Royalties.load('0')
  if (royalties == null) {
    royalties = new Royalties('0')
  }
  // TODO Seems wrong that this is duplicated here and in the contract
  royalties.totalClaimableBalance = royalties.totalClaimableBalance
    .minus(event.params.amount)
  royalties.save()

  let transfer = new Transfer(event.transaction.hash.toHex())
  transfer.to = event.params.account
  transfer.amount = event.params.amount
  transfer.blockNumber = event.block.number
}