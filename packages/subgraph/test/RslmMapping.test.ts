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
 */

import { assert } from 'chai'
import {
  REV_SHARE_LM_ADDR,
  DEF_SHARE,
  NFT,
  queryContent,
  queryRevShareLicenses,
  makeContentId,
  makeLicenseId,
  alice,
  registerRSL,
  unregisterRSL,
  mintAndRegisterRSL,
  delay
} from './utils'

async function checkNftRegistrationRSL(nft: NFT, share: number) {
  const content = await queryContent(nft)
  const licenses = await queryRevShareLicenses(nft, REV_SHARE_LM_ADDR)
  const license = licenses[0]

  assert.equal(content.id, makeContentId(nft), 'content id')
  assert.equal(content.nftAddress, nft.address, 'content nft address')
  assert.equal(content.nftId, nft.id, 'content nft id')
  assert.equal(license.id, makeLicenseId(nft, REV_SHARE_LM_ADDR), 'license id')
  assert.equal(license.licenseManagerAddress, REV_SHARE_LM_ADDR, 'license manager address')
  assert.equal(license.registrant, alice.address.toLowerCase(), 'license registrant')
  assert.equal(license.minSharePercentage, share, 'license share percentage')
}

describe('RevShareLicenseManager mapping', function () {
  this.timeout(20000)

  it('should add a license on NFTRegistered event', async () => {
    const nft = await mintAndRegisterRSL()
    await checkNftRegistrationRSL(nft, DEF_SHARE)
  })

  it('should replace existing license on NFTRegistered event', async () => {
    const nft = await mintAndRegisterRSL()
    await checkNftRegistrationRSL(nft, DEF_SHARE)
    const newShare = 51
    await registerRSL(nft, newShare)
    await delay(5000)
    await checkNftRegistrationRSL(nft, newShare)
  })

  it('should delete a license on NFTUnregistered event', async () => {
    const nft = await mintAndRegisterRSL()
    await checkNftRegistrationRSL(nft, DEF_SHARE)
    await unregisterRSL(nft)
    const licenses = await queryRevShareLicenses(nft, REV_SHARE_LM_ADDR)
    assert.equal(licenses.length, 0)
  })
})