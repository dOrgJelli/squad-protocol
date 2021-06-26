import { ethers } from 'hardhat'
import { assert, expect } from 'chai'
const zdk = require('@zoralabs/zdk')

/**
 * Tests:
 *  - on registerNFT, stores new valid LicenseParams and emits event
 *  - on registerNFT, fails if sharePercentage is greater than 100
 *  - on registerNFT, fails if msg.sender does not own the NFT
 *  - SKIP on createAndRegisterNFT, mints a new NFT to the msg.sender and calls registerNFT
 *  - on unregisterNFT, deletes LicenseParams and emits event
 *  - on unregisterNFT, fails if msg.sender does not own the NFT TODO
 *  - on purchase, transfers tokens, mints license(s), and emits event
 *  - on holdsLicense, returns true if holder has 1+ ether of license token
 *  - on holdsLicense, returns false if holder has <1 ether of license token
 */

describe('PurchasableLicenseManager', () => {
    /**
     * Before each should:
     *  - prepare accounts, (alice, royalties address)
     *  - deploy erc20mintable, purchasable license and mock media
     */

    let owner, alice 
    let royaltiesAddress: string
    let erc20
    let purchasableLicense, licenseAlice
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
        royaltiesAddress = await wallets[2].getAddress()

        const MockMedia = await ethers.getContractFactory('MockMedia')
        mockMedia = await MockMedia.deploy()

        const ERC20Mintable = await ethers.getContractFactory('ERC20Mintable')
        erc20 = await ERC20Mintable.deploy('Fake DAI', 'fDAI')

        const PurchasableLicenseManager = await ethers.getContractFactory('PurchasableLicenseManager')
        purchasableLicense = await PurchasableLicenseManager.deploy(
            'Buy usage rights to an NFT for a set price.',
            mockMedia.address,
            erc20.address,
            royaltiesAddress
        )
        licenseAlice = purchasableLicense.connect(alice)
    })

    it('on registerNFT, stores new valid LicenseParams and emits event', async () => {
        await mintNFT()

        await expect(licenseAlice.registerNFT(
            mockMedia.address,
            0,
            10,
            50
        ))
            .to.emit(purchasableLicense, 'NFTRegistered')
        
        const licenseParams = await purchasableLicense.registeredNFTs(mockMedia.address, 0)

        // price
        assert.equal(Number(ethers.utils.formatEther(licenseParams[0])), 10)

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

    it('on registerNFT, fails if sharePercentage is greater than 100', async () => {
        await mintNFT()

        await expect(licenseAlice.registerNFT(
            mockMedia.address,
            0,
            10,
            101
        ))
            .to.be.revertedWith('sharePercentage greater than 100.')
    })

    it('on registerNFT, fails if msg.sender does not own the NFT', async () => {
        await mintNFT()

        await expect(purchasableLicense.registerNFT(
            mockMedia.address,
            0,
            10,
            50
        ))
            .to.be.revertedWith('Message sender does not own NFT.')
    })

    /* skip this test for now, because it's difficult to get a local version of zora running
    it(
        'on createAndRegisterNFT, mints a new NFT to the msg.sender and calls registerNFT', 
        async () => {
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
            const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 // 24 hours
            const domain = {
                name: 'Zora',
                version: '1',
                chainId: 1,
                verifyingContract: mockMedia.address,
            }
            const nonce = ethers.BigNumber.from(0)
            const wallet = ethers.Wallet.createRandom()
            
            const eipSig = await zdk.signMintWithSigMessage(
              wallet,
              contentHash,
              metadataHash,
              zdk.Decimal.new(10).value,
              nonce.toNumber(),
              deadline,
              domain
            )

            const walletWithProvider = wallet.connect(owner.provider)
            await owner.sendTransaction({
                to: walletWithProvider.address,
                value: ethers.utils.parseEther('1')
            })
            const licenseWallet = purchasableLicense.connect(walletWithProvider)
            await expect(licenseWallet.createAndRegisterNFT(
                mediaData,
                bidShares,
                eipSig,
                10,
                50
            ))
    })
    */

    it('on unregisterNFT, deletes LicenseParams and emits event', async () => {
        await mintNFT()

        await licenseAlice.registerNFT(
            mockMedia.address,
            0,
            10,
            50
        )

        await expect(licenseAlice.unregisterNFT(
            mockMedia.address,
            0
        ))
          .to.emit(purchasableLicense, 'NFTUnregistered')
          .withArgs(
              mockMedia.address,
              ethers.BigNumber.from(0)
          )

        const licenseParams = await purchasableLicense.registeredNFTs(
            mockMedia.address,
            0
        )
        assert.equal(licenseParams[2], '0x0000000000000000000000000000000000000000')
    })

    it('on unregisterNFT, fails if msg.sender does not own the NFT', async () => {
        await mintNFT()

        await licenseAlice.registerNFT(
            mockMedia.address,
            0,
            10,
            50
        )

        await expect(purchasableLicense.unregisterNFT(
            mockMedia.address,
            0
        ))
          .to.be.revertedWith('Message sender does not own NFT.')
    })

    it('on purchase, transfers tokens, mints license(s), and emits event', async () => {
        await mintNFT()

        await licenseAlice.registerNFT(
            mockMedia.address,
            0,
            10,
            50
        )

        const ownerAddress = await owner.getAddress()

        await erc20.mint(ownerAddress, ethers.utils.parseEther('100'))
        await erc20.approve(purchasableLicense.address, ethers.utils.parseEther('10'))

        const licenseTokenAddress = (await purchasableLicense.registeredNFTs(
            mockMedia.address,
            0
        ))[2]

        await expect(purchasableLicense.purchase(
            mockMedia.address, 
            0,
            ownerAddress,
            1
        ))
            .to.emit(purchasableLicense, 'Purchase')
            .withArgs(
                mockMedia.address, 
                ethers.BigNumber.from(0), 
                ownerAddress, 
                1,
                licenseTokenAddress
            )

        const licenseToken = erc20.attach(licenseTokenAddress)
        const balance = Number(ethers.utils.formatEther(await licenseToken.balanceOf(ownerAddress)))
        assert.equal(balance, 1)

        const royaltiesBalance = Number(ethers.utils.formatEther(await erc20.balanceOf(royaltiesAddress)))
        assert.equal(royaltiesBalance, 10)
    })

    it('on holdsLicense, returns true if holder has 1+ ether of license token', async () => {
        await mintNFT()

        await licenseAlice.registerNFT(
            mockMedia.address,
            0,
            10,
            50
        )

        const ownerAddress = await owner.getAddress()

        await erc20.mint(ownerAddress, ethers.utils.parseEther('100'))
        await erc20.approve(purchasableLicense.address, ethers.utils.parseEther('10'))

        await purchasableLicense.purchase(
            mockMedia.address, 
            0,
            ownerAddress,
            1
        )

        assert.equal(
            await purchasableLicense.holdsLicense(
                mockMedia.address,
                0,
                ownerAddress
            ),
            true
        )
    })

    it('on holdsLicense, returns false if holder has <1 ether of license token', async () => {
        await mintNFT()

        await licenseAlice.registerNFT(
            mockMedia.address,
            0,
            10,
            50
        )

        const ownerAddress = await owner.getAddress()

        await erc20.mint(ownerAddress, ethers.utils.parseEther('100'))
        await erc20.approve(purchasableLicense.address, ethers.utils.parseEther('10'))

        await purchasableLicense.purchase(
            mockMedia.address, 
            0,
            ownerAddress,
            1
        )

        const licenseTokenAddress = (await purchasableLicense.registeredNFTs(
            mockMedia.address,
            0
        ))[2]
        const licenseToken = erc20.attach(licenseTokenAddress)
        const licenseOwner = licenseToken.connect(owner)
        await licenseOwner.transfer(
            await alice.getAddress(),
            1
        )

        assert.equal(
            await purchasableLicense.holdsLicense(
                mockMedia.address,
                0,
                ownerAddress
            ),
            false
        )
    })
})