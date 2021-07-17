/**
 * a full local subgraph + contracts must be deployed before running tests (see README)
 * 
 * - on TransferToken
 *    - Token transfer is added to subgraph
 *    - Total unclaimed in royalties is reduced in subgraph
 * 
 * - on WindowIncremented
 *    - new window is added to subgraph, at the correct index
 */

import { assert } from 'chai'
import {
  ROOT,
  alice,
  queryWindow,
  queryTransfer,
  mintAndIncrement,
  claim,
  getBalanceForWindow,
  getTotalClaimableBalance,
  getCurrentWindow
} from './utils'

// TODO tests should all also be checking block number
async function checkWindow(): Promise<number> {
  const currentWindowNumber = await getCurrentWindow()
  const index = currentWindowNumber - 1
  const id = '0x' + index.toString(16)
  const window = await queryWindow(id)
  const balanceForWindow = await getBalanceForWindow(index)
  
  assert.equal(window.index, index, 'index')
  assert.equal(window.merkleRoot, ROOT, 'root')
  assert.equal(window.fundsAvailable, balanceForWindow.toString(), 'total claimable')
  return index
}

describe('Royalties mapping', function () {
  this.timeout(20000)

  it('adds a new window on WindowIncremented event', async () => {
    await mintAndIncrement()
    await checkWindow()
  })

  it('records a token transfer and reduces total unclaimed on TransferToken event', async () => {
    await mintAndIncrement()
    const index = await checkWindow()

    const beforeTotalClaimable = Number(await getTotalClaimableBalance())
    const tx = await claim(index)
    const transfer = await queryTransfer(tx.hash)
    const claimAmount = 5000000000000000000
    const afterTotalClaimable = beforeTotalClaimable - claimAmount

    assert.equal(transfer.to, alice.address.toLowerCase(), 'to')
    assert.equal(transfer.amount, claimAmount.toString(), 'amount')
    assert.equal(transfer.totalClaimableBalance, afterTotalClaimable, 'total')
  })
})