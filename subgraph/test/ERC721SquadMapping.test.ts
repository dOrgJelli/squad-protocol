/**
 * a full local subgraph + contracts must be deployed before running tests (see README)
 *
 * - on TokenMinted
 *    - NFT is added to subgraph
 */

import { assert } from 'chai'
import {
  signer,
  defTokenData,
  mint,
  delay,
  querySquadNFT
} from './utils'

describe('ERC721Squad mapping', function (this: any) {
  this.timeout(20000)

  it('should add an NFT on TokenMinted event', async () => {
    const nft = await mint()
    await delay(5000)

    const query = await querySquadNFT(nft)
    const aliceAddress = await signer.address
    assert.equal(query.id, nft.id, 'id')
    assert.equal(query.creator, aliceAddress.toLowerCase(), 'creator')
    assert.equal(query.contentURI, defTokenData.contentURI, 'content URI')
    assert.equal(query.metadataURI, defTokenData.metadataURI, 'metadata URI')
    assert.equal(query.blockCreated, nft.blockCreated, 'block number')
    assert.equal(query.metadataHash, nft.metadataHash, 'hash')
  })
})
