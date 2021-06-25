import { ethers } from 'hardhat'
import { assert, expect } from 'chai'
const zdk = require('@zoralabs/zdk')

/**
 * Tests
 *  - on registerNFT, stores new valid LicenseParams and emits event
 *  - on registerNFT, fails if sharePercentage is greater than 100
 *  - on registerNFT, fails if msg.sender does not own the NFT
 *  - SKIP on createAndRegisterNFT, mints a new NFT to the msg.sender and calls registerNFT
 *  - on unregisterNFT, deletes LicenseParams and emits event
 *  - on unregisterNFT, fails if msg.sender does not own the NFT
 */

describe('RevShareLicense', () => {
  /**
   * Before each should:
   *  - prepare accounts (owner, alice)
   *  - deploy rev share license and mock media
   */

  let owner, alice
  let revShareLicense, licenseAlice
  let mockMedia

  async function mintNFT() {
      const mediaAlice = mockMedia.connect(alice)
      const data = "example text"
      const metadata = "example metadata"
      const contentHash = await zdk.sha256FromBuffer(Buffer.from(data))
      const metadataHash = await zdk.sha256FromBuffer(Buffer.from(metadata))
      const mediaData = zdk.constructMediaData(
        `https://example1.net/`,
        `https://example2.net/`,
        contentHash,
        metadataHash
      )
      const bidShares = zdk.constructBidShares(10, 70, 20)
      await mediaAlice.mint(mediaData, bidShares)
  }

  beforeEach(async () => {
      const wallets = await ethers.getSigners()
      owner = wallets[0]
      alice = wallets[1]

      const MockMedia = await ethers.getContractFactory('MockMedia')
      mockMedia = await MockMedia.deploy()

      const RevShareLicense = await ethers.getContractFactory('RevShareLicense')
      revShareLicense = await RevShareLicense.deploy(
          'Commercial works derivative of works registered must share a percentage of revenue.',
          mockMedia.address
      )

      licenseAlice = revShareLicense.connect(alice)
  })

  it('on registerNFT, stores share percent and emits event', async () => {
      await mintNFT()

      await expect(licenseAlice.registerNFT(
          mockMedia.address,
          0,
          20
      ))
          .to.emit(revShareLicense, 'NFTRegistered')

      const sharePercent = Number(await revShareLicense.registeredNFTs(mockMedia.address, 0))
      assert.equal(sharePercent, 20)
  })

  it('on registerNFT, fails if sharePercentage is greater than 100', async () => {
      await mintNFT()

      await expect(licenseAlice.registerNFT(
          mockMedia.address,
          0,
          101
      ))
          .to.be.revertedWith('sharePercentage greater than 100.')
  })

  it('on registerNFT, fails if msg.sender does not own the NFT', async () => {
      await mintNFT()

      await expect(revShareLicense.registerNFT(
        mockMedia.address,
        0,
        20
    ))
        .to.be.revertedWith('Message sender does not own NFT.')
  })

  it('on unregisterNFT, deletes share percent and emits event', async () => {
      await mintNFT()

      await licenseAlice.registerNFT(
          mockMedia.address,
          0,
          20
      )

      await expect(licenseAlice.unregisterNFT(
          mockMedia.address,
          0
      ))
        .to.emit(revShareLicense, 'NFTUnregistered')

      const sharePercent = Number(await revShareLicense.registeredNFTs(mockMedia.address, 0))
      assert.equal(sharePercent, 0)
  })

  it('on unregisterNFT, fails if msg.sender does not own the NFT', async () => {
      await mintNFT()

      await licenseAlice.registerNFT(
          mockMedia.address,
          0,
          20
      )

      await expect(revShareLicense.unregisterNFT(
          mockMedia.address,
          0
      ))
        .to.be.revertedWith('Message sender does not own NFT.')
  })

})