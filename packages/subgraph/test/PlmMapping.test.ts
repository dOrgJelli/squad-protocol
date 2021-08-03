/**
 * a full local subgraph + contracts must be deployed before running tests (see README)
 * 
 * - on NFTRegistered
 *    - license is added to content in subgraph
 *    - new license replaces the previous one
 * 
 * - on NFTUnregistered
 *    - License is removed from content in subgraph
 * 
 * - on Purchase
 *    - Purchase event is added to subgraph
 * 
 * http://127.0.0.1:8000/subgraphs/name/squadgames/squad-POC-subgraph/graphql
 */

import { ethers } from 'ethers'
import { assert } from 'chai'
import {
  DEF_PRICE,
  DEF_SHARE,
  PURCHASABLE_LM_ADDR,
  NFT,
  queryContent,
  queryPurchasableLicenses,
  queryPurchases,
  getPurchasableLicense,
  makeContentId,
  makeLicenseId,
  alice,
  mintAndRegisterPL,
  registerPL,
  unregisterPL,
  mintDaiAndPurchase,
  delay
} from './utils'

async function checkNftRegistrationPL(nft: NFT, price: ethers.BigNumber, share: number) {
  const content = await queryContent(nft)
  const licenses = await queryPurchasableLicenses(nft, PURCHASABLE_LM_ADDR)
  const license = licenses[0]
  const licenseTokenAddr: string = (await getPurchasableLicense(nft)).licenseToken.toLowerCase()

  assert.equal(content.id, makeContentId(nft), 'content id')
  assert.equal(content.nftAddress, nft.address, 'content nft address')
  assert.equal(content.nftId, nft.id, 'content nft id')
  assert.equal(license.id, makeLicenseId(nft, PURCHASABLE_LM_ADDR), 'license id')
  assert.equal(license.licenseManagerAddress, PURCHASABLE_LM_ADDR, 'license manager address')
  assert.equal(license.licenseTokenAddress, licenseTokenAddr, 'license token address')
  assert.equal(license.registrant, alice.address.toLowerCase(), 'license registrant')
  assert.equal(license.price, price, 'license price')
  assert.equal(license.sharePercentage, share, 'license share percentage')
}

describe('PurchasableLicenseManager mapping', function () {
  this.timeout(20000)

  it('should add a license on NFTRegistered event', async () => {
    const nft = await mintAndRegisterPL()
    await checkNftRegistrationPL(nft, DEF_PRICE, DEF_SHARE)
  })

  it('should replace existing license on NFTRegistered event', async () => {
    const nft = await mintAndRegisterPL()
    await checkNftRegistrationPL(nft, DEF_PRICE, DEF_SHARE)
    const newPrice = ethers.utils.parseEther('11')
    const newShare = 51
    await registerPL(nft, newPrice, newShare)
    await delay(5000)
    await checkNftRegistrationPL(nft, newPrice, newShare)
  })

  it('should delete a license on NFTUnregistered event', async () => {
    const nft = await mintAndRegisterPL()
    await checkNftRegistrationPL(nft, DEF_PRICE, DEF_SHARE)
    await unregisterPL(nft)
    const licenses = await queryPurchasableLicenses(nft, PURCHASABLE_LM_ADDR)
    assert.equal(licenses.length, 0)
  })

  it('should record a Purchase', async () => {
    const nft = await mintAndRegisterPL()
    await checkNftRegistrationPL(nft, DEF_PRICE, DEF_SHARE)
    const blockNumber = await mintDaiAndPurchase(nft, DEF_PRICE)
    const purchase = (await queryPurchases(nft, PURCHASABLE_LM_ADDR))[0]
    const licenseTokenAddr: string = (await getPurchasableLicense(nft)).licenseToken.toLowerCase()
    assert.equal(purchase.licenseTokenAddress, licenseTokenAddr, 'license token address')
    assert.equal(purchase.licensesBought, '1', 'licenses bought')
    assert.equal(purchase.pricePaid, DEF_PRICE, 'price paid')
    assert.equal(purchase.purchaser, alice.address.toLowerCase(), 'purchaser')
    assert.equal(purchase.blockNumber, blockNumber, 'block number')
  })
})