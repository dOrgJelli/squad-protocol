/**
 * - base: https://eips.ethereum.org/EIPS/eip-721
 * - Tokens can be minted by anyone on behalf of anyone
 * - Tokens can only be minted if a non-empty contentURI and metadataURI are included
 * - Each token has an automatically created ID, incremented upward
 * - For each token, a specific contentURI and metadataURI is stored mapped to its ID
 */

import { ethers } from 'hardhat'
import { assert } from 'chai'
import { ethers as ethersTypes } from 'ethers'
import { ERC721Squad } from '../typechain/ERC721Squad'
import { ERC721Squad__factory } from '../typechain/factories/ERC721Squad__factory'

describe('ERC721Squad', () => {
  let owner: ethersTypes.Signer
  let alice: ethersTypes.Signer
  let squadNft: ERC721Squad

  interface TokenData {
    contentURI: string
    metadataURI: string
    contentHash: ethersTypes.BytesLike
    metadataHash: ethersTypes.BytesLike
  }

  const defTokenData: TokenData = {
    contentURI: 'contentURI',
    metadataURI: 'metadataURI',
    contentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('contentURI')),
    metadataHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('metadataURI'))
  }

  async function mint (signer: ethersTypes.Signer): Promise<void> {
    const squadNftWithSigner = squadNft.connect(signer)

    await squadNftWithSigner.mint(
      await owner.getAddress(),
      defTokenData.contentURI,
      defTokenData.metadataURI,
      defTokenData.contentHash,
      defTokenData.metadataHash
    )
  }

  async function checkNFT (id: number): Promise<void> {
    const contentURI = await squadNft.contentURIs(id)
    const metadataURI = await squadNft.metadataURIs(id)
    const contentHash = await squadNft.contentHashes(id)
    const metadataHash = await squadNft.metadataHashes(id)
    assert.equal(contentURI, defTokenData.contentURI, 'content URI')
    assert.equal(metadataURI, defTokenData.metadataURI, 'metadata URI')
    assert.equal(contentHash, defTokenData.contentHash, 'content hash')
    assert.equal(metadataHash, defTokenData.metadataHash, 'metadata hash')
  }

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    owner = signers[0]
    alice = signers[1]

    const ERC721SquadFactory = new ERC721Squad__factory(owner)
    squadNft = await ERC721SquadFactory.deploy('Squad NFT', 'sNFT')
  })

  describe('mint', () => {
    it('lets a creator mint a token', async () => {
      await mint(owner)
      await checkNFT(0)
    })

    it('counts ids up incrementally', async () => {
      await mint(owner)
      await checkNFT(0)
      await mint(owner)
      await checkNFT(1)
      await mint(owner)
      await checkNFT(2)
    })

    it('lets someone mint a token for a creator', async () => {
      await mint(alice)
      await checkNFT(0)
    })
  })
})
