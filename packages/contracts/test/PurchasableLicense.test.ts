import { ethers } from 'hardhat'
import { assert, expect } from 'chai'
const zdk = require('@zoralabs/zdk')

/**
 * Tests:
 *  - on registerNFT, stores new valid LicenseParams and emits event
 *  - on registerNFT, fails if sharePercentage is less than 0 or greater than 100
 *  - on registerNFT, fails if msg.sender does not own the NFT
 *  - on createAndRegisterNFT, mints a new NFT to the msg.sender and calls registerNFT
 *  - on unregisterNFT, deletes LicenseParams and emits event
 *  - on purchase, transfers tokens, mints license(s), and emits event
 *  - on purchase, fails without proper allowance
 *  - on holdsLicense, returns true if holder has 1+ ether of license token
 *  - on holdsLicense, returns false if holder has <1 ether of license token
 */

describe('PurchasableLicense', () => {
    /**
     * Before each should:
     *  - prepare accounts, (alice, royalties address)
     *  - deploy erc20mintable, purchasable license and zora contracts
     */

    let owner, alice 
    let royaltiesAddress: string
    let erc20
    let purchasableLicense
    let mockMedia

    beforeEach(async () => {
        const wallets = await ethers.getSigners()
        owner = wallets[0]
        alice = wallets[1]
        royaltiesAddress = await wallets[2].getAddress()

        const MockMedia = await ethers.getContractFactory('MockMedia')
        mockMedia = await MockMedia.deploy()

        const ERC20Mintable = await ethers.getContractFactory('ERC20Mintable')
        erc20 = await ERC20Mintable.deploy('Fake DAI', 'fDAI')

        const PurchasableLicense = await ethers.getContractFactory('PurchasableLicense')
        purchasableLicense = await PurchasableLicense.deploy(
            'Buy usage rights to an NFT for a set price',
            erc20.address,
            royaltiesAddress
        )
    })

    it('on registerNFT, stores new valid LicenseParams and emits event', async () => {
        const mediaAlice = mockMedia.connect(alice)
        const licenseAlice = purchasableLicense.connect(alice)

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

        await expect(licenseAlice.registerNFT(
            mockMedia.address,
            0,
            10,
            50
        ))
          .to.emit(purchasableLicense, 'NFTRegistered')
        
        const licenseParams = await purchasableLicense.registeredNFTs(mockMedia.address, 0)

        // price
        assert.equal(Number(licenseParams[0]), 10)

        // share percentage
        assert.equal(Number(licenseParams[1]), 50)

        // license token
        const licenseToken = erc20.attach(licenseParams[2])
        const balance = await licenseToken.balanceOf(await alice.getAddress())
        assert.equal(
            Number(balance), 
            0
        )
    })
})