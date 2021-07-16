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
 * 
 * fDai deployed to 0x5FbDB2315678afecb367f032d93F642f64180aa3
 * Royalties deployed to 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
 * MockMedia deployed to 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
 * RevShareLicenseManager deployed to 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
 * PurchasableLicenseManager deployed to 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
 * 
 * Hardhat accounts
 * Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
 * Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 * 
 * Account #1: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (10000 ETH)
 * Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
 * 
 * Account #2: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc (10000 ETH)
 * Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
 * 
 * Account #3: 0x90f79bf6eb2c4f870365e785982e1f101e93b906 (10000 ETH)
 * Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
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
  queryAllContent,
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
    // const allContent = await queryAllContent()
    // console.log('most recent content id query', (allContent[allContent.length-1].id))
    await checkNftRegistrationPL(nft, DEF_PRICE, DEF_SHARE)
  })

  it('should replace existing license on NFTRegistered event', async () => {
    const nft = await mintAndRegisterPL()
    // const allContent = await queryAllContent()
    // console.log('most recent content id query', (allContent[allContent.length-1].id))
    await checkNftRegistrationPL(nft, DEF_PRICE, DEF_SHARE)
    const newPrice = ethers.utils.parseEther('11')
    const newShare = 51
    await registerPL(nft, newPrice, newShare)
    await delay(5000)
    await checkNftRegistrationPL(nft, newPrice, newShare)
  })

  it('should delete a license on NFTUnregistered event', async () => {
    const nft = await mintAndRegisterPL()
    // const allContent = await queryAllContent()
    // console.log('most recent content id query', (allContent[allContent.length-1].id))
    await checkNftRegistrationPL(nft, DEF_PRICE, DEF_SHARE)
    await unregisterPL(nft)
    const licenses = await queryPurchasableLicenses(nft, PURCHASABLE_LM_ADDR)
    assert.equal(licenses.length, 0)
  })

  it('should record a Purchase', async () => {
    const nft = await mintAndRegisterPL()
    // const allContent = await queryAllContent()
    // console.log('most recent content id query', (allContent[allContent.length-1].id))
    await checkNftRegistrationPL(nft, DEF_PRICE, DEF_SHARE)
    await mintDaiAndPurchase(nft, DEF_PRICE)
    const purchase = (await queryPurchases(nft, PURCHASABLE_LM_ADDR))[0]
    const licenseTokenAddr: string = (await getPurchasableLicense(nft)).licenseToken.toLowerCase()
    assert.equal(purchase.licenseTokenAddress, licenseTokenAddr, 'license token address')
    assert.equal(purchase.licensesBought, '1', 'licenses bought')
    assert.equal(purchase.pricePaid, DEF_PRICE, 'price paid')
    assert.equal(purchase.purchaser, alice.address.toLowerCase(), 'purchaser')
  })
})