/**
 * a full local subgraph + contracts must be deployed before running tests (see README)
 * 
 * - on TokenMinted
 *    - NFT is added to subgraph
 */

import { assert } from 'chai'
import { 
  alice,
  defTokenData,
  mint, 
  delay, 
  querySquadNFT 
} from './utils'

describe('ERC721Squad mapping', function () {
  this.timeout(20000)

  it('should add an NFT on TokenMinted event', async () => {
    const nft = await mint()
    await delay(5000)

    const query = await querySquadNFT(nft)
    assert.equal(query.id, Number(nft.id), 'id')
    assert.equal(query.creator, alice.address.toLowerCase(), 'creator')
    assert.equal(query.contentURI, defTokenData.contentURI, 'content URI')
    assert.equal(query.metadataURI, defTokenData.metadataURI, 'metadata URI')
    assert.equal(query.blockCreated, nft.blockCreated, 'block number')
  })
})