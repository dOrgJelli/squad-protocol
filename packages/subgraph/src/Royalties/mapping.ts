import { BigInt } from "@graphprotocol/graph-ts"
import { WindowIncremented, TransferToken } from '../../generated/Royalties/Royalties'
import { Window, Transfer } from '../../generated/schema'

export function handleWindowIncremented(event: WindowIncremented): void {
  let windowIndex = event.params.currentWindow.minus(BigInt.fromString('1'))
  let window = new Window(windowIndex.toHex())
  window.index = windowIndex
  window.fundsAvailable = event.params.fundsAvailable
  window.merkleRoot = event.params.merkleRoot
  window.blockNumber = event.block.number
  window.save()
}

export function handleTransferToken(event: TransferToken): void {
  let transfer = new Transfer(event.transaction.hash.toHex())
  transfer.to = event.params.account
  transfer.amount = event.params.amount
  transfer.totalClaimableBalance = event.params.totalClaimableBalance
  transfer.blockNumber = event.block.number
  transfer.save()
}