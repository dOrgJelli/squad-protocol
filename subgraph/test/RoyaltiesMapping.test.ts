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
  getProofInfo,
  signer,
  queryWindow,
  queryTransfer,
  mintAndIncrement,
  claim,
  getBalanceForWindow,
  getTotalClaimableBalance,
  getCurrentWindow
} from './utils'

async function checkWindow (): Promise<number> {
  const blockNumber = await mintAndIncrement()
  const currentWindowNumber = await getCurrentWindow()
  const index = currentWindowNumber - 1
  const id = '0x' + index.toString(16)
  const window = await queryWindow(id)
  const balanceForWindow = await getBalanceForWindow(index)

  const { ROOT } = await getProofInfo()
  assert.equal(window.index, index, 'index')
  assert.equal(window.merkleRoot, ROOT, 'root')
  assert.equal(window.fundsAvailable, balanceForWindow.toString(), 'total claimable')
  assert.equal(window.blockNumber, blockNumber, 'block number')
  return index
}

describe('Royalties mapping', function (this: any) {
  this.timeout(20000)

  it('adds a new window on WindowIncremented event', async () => {
    await checkWindow()
  })

  it('records a token transfer and reduces total unclaimed on TransferToken event', async () => {
    const index = await checkWindow()

    const beforeTotalClaimable = Number(await getTotalClaimableBalance())
    const claimRes = await claim(index)
    const transfer = await queryTransfer(claimRes.tx.hash)
    const claimAmount = 5000000000000000000
    const afterTotalClaimable = beforeTotalClaimable - claimAmount

    const aliceAddress = await signer.address
    assert.equal(transfer.to, aliceAddress.toLowerCase(), 'to')
    assert.equal(transfer.amount, claimAmount.toString(), 'amount')
    assert.equal(transfer.totalClaimableBalance, afterTotalClaimable, 'total')
    assert.equal(transfer.blockNumber, claimRes.res.blockNumber, 'block number')
  })
})
