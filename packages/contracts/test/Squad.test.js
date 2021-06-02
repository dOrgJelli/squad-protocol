const { assert, expect } = require('chai')

describe('Squad', () => {
    let alice, bob, 
        squad, squadAlice, squadBob, 
        squadRights1, squadRights1Alice, squadRights1Bob,
        squadRights2, squadRights2Alice, squadRights2Bob,
        token1, token1Alice, token1Bob,
        token2, token2Alice, token2Bob,
        erc721
    const nftIdAlice = 1
    const nftIdBob = 2
    let nftCount = 2

    // before should:
        // establish 2+ user accounts (alice + bob)
        // deploy Squad w/ a non-0 fee, SquadRights x2, ERC20Mintable (reserve) x2, and an ERC721
        // mint 2 NFTs (1 for bob, 1 for alice)
        // mint some of both ERC20s for alice and bob
        // register one NFT without weights
        // addPayment to add one of the ERC20s to the system

    beforeEach(async () => {
        const wallets = await ethers.getSigners()
        alice = await wallets[1].getAddress()
        bob = await wallets[2].getAddress()

        // deploy RightsManagers
        const SquadRights = await ethers.getContractFactory('SquadRights')
        squadRights1 = await SquadRights.deploy()
        squadRights1Alice = squadRights1.connect(wallets[1])
        squadRights1Bob = squadRights1.connect(wallets[2])

        squadRights2 = await SquadRights.deploy()
        squadRights2Alice = squadRights2.connect(wallets[1])
        squadRights2Bob = squadRights2.connect(wallets[2])
        
        // deploy Squad with one rights manager and non-0 fee
        const Squad = await ethers.getContractFactory('Squad')
        squad = await Squad.deploy([squadRights1.address], 100)
        squadAlice = squad.connect(wallets[1])
        squadBob = squad.connect(wallets[2])
        
        // deploy ERC20s
        const ERC20Mintable = await ethers.getContractFactory('ERC20Mintable')
        token1 = await ERC20Mintable.deploy('token1', 'TK1')
        token1Alice = token1.connect(wallets[1])
        token1Bob = token1.connect(wallets[2])
        token2 = await ERC20Mintable.deploy('token2', 'TK2')
        token2Alice = token2.connect(wallets[1])
        token2Bob = token2.connect(wallets[2])
        
        // deploy ERC721
        const ERC721 = await ethers.getContractFactory('ERC721Mintable')
        erc721 = await ERC721.deploy('NFT', 'NFT')

        // transfer RightsManagers ownership to Squad
        await squadRights1.transferOwnership(squad.address)
        await squadRights2.transferOwnership(squad.address)

        // mint tokens for Alice and Bob
        await token1.mint(alice, ethers.utils.parseEther('1000'))
        await token2.mint(alice, ethers.utils.parseEther('1000'))
        await token1.mint(bob, ethers.utils.parseEther('1000'))
        await token2.mint(bob, ethers.utils.parseEther('1000'))

        // mint NFTs owned by Alice and Bob
        await erc721.mint(alice, nftIdAlice)
        await erc721.mint(bob, nftIdBob)
        
        // register Alice's NFT in Squad with squadRights1
        await squadAlice.registerNFT(
            erc721.address, 
            nftIdAlice,
            500,
            [],
            [],
            [],
            squadRights1.address,
            token1.address,
            ethers.utils.parseEther('10')
        )

        // Bob buy rights in Alice's NFT from squadRights1
        const [, amount] = await squadRights1.price(erc721.address, nftIdAlice)
        await token1Bob.approve(squadRights1.address, amount)
        await squadRights1Bob.buy(erc721.address, nftIdAlice)
    })

    // helpers
    async function fullWeights(addresses, ids, weights) {
        const resultsAddresses = []
        const resultsIds = []
        const resultsWeights = []
        for(let i = 0; i < addresses.length; i++) {
            const license = await squad.getLicense(addresses[i], ids[i])
            if (license.weights.length > 0) {
                resultsAddresses.push(addresses[i])
                resultsIds.push(ids[i])
                resultsWeights.push(weights[i] * license.ownerShare / 10000)
                license.weights.forEach((_, j) => {
                    if (license.weights[j] * weights[i] / 10000 * license.ownerShare / 10000 > 1*10^-18) {
                        resultsAddresses.push(license.weightsAddresses[j])
                        resultsIds.push(license.weightsIds[j])
                        resultsWeights.push(license.weights[j] * weights[i] / 10000 * license.ownerShare / 10000)
                    }
                })
            } else {
                resultsAddresses.push(addresses[i])
                resultsIds.push(ids[i])
                resultsWeights.push(weights[i])
            }
        }
        return [resultsAddresses, resultsIds, resultsWeights]
    }

    // non-owner of NFT can't register that NFT 
    // owner can register an NFT with weights
        // ERC20s created by rights managers
        // license is stored correctly
            // Rights Params are correct
            // weights are correct
                // test this by going deep 3+ layers and checking that weights stay correct
        // ownerShare cannot be greater than 10,000
        // sum of weights cannot be greater than 10,000
    // rightsParamsFor returns correct data
    // addresses that are not registered rightsManagers cannot addPayment
    // addPayment with a new ERC20 adds the token to the system
    // addPayment changes accounting balances correctly according to the weights
    // withdraw retrieves the expected amount for the user and the fee
    // 0 address cannot be added as a rightsManager
    // valid address can be added as a rightsManager
    // rightsManagers can be removed with a valid index
    // removing a rightsManager leaves a "whole" in the array, which adding a new rightsManager will "fill"
    // setFee updates the fee properly

    it('cannot be constructed with a fee higher than 10000', async () => {
        const Squad = await ethers.getContractFactory('Squad')
        try {
            await Squad.deploy([squadRights1.address], 10001)
        } catch (e) {
            assert.equal(e.name, 'ProviderError')
        }
    })

    it('does not let someone besides the NFT owner register an NFT', async () => {
        try {
            await squadAlice.registerNFT(
                erc721.address, 
                nftIdBob,
                500,
                [],
                [],
                [],
                squadRights1.address,
                token1.address,
                ethers.utils.parseEther('10')
            )
        } catch (e) {
            assert.equal(e.name, 'ProviderError')
        }
    })

    it('does not let an owner register an NFT with an ownerShare greater than 10,000', async () => {
        try {
            await squadAlice.registerNFT(
                erc721.address,
                nftIdBob,
                10001,
                [],
                [],
                [],
                squadRights1.address,
                token1.address,
                ethers.utils.parseEther('1')
            )
        } catch (e) {
            assert.equal(e.name, 'ProviderError')
        }
    })

    it('does not let an owner register an NFT with weights that sum to > 10,000', async () => {
        try {
            await squadAlice.registerNFT(
                erc721.address,
                nftIdBob,
                1000,
                [erc721.address, erc721.address],
                [nftIdAlice, nftIdAlice],
                [5000, 5001],
                squadRights1.address,
                token1.address,
                ethers.utils.parseEther('1')
            )
        } catch (e) {
            assert.equal(e.name, 'ProviderError')
        }
    })

    it('lets an owner register an NFT with weights, which someone else can buy rights to', async () => {
        const weightsAddresses = []
        const weightsIds = []
        const weights = []
        const length = 50
        for (let i = 0; i < length; i++) {
            weightsAddresses.push(erc721.address)
            weightsIds.push(nftIdAlice)
            weights.push(10000 / length)
        }
        nftCount++
        await erc721.mint(bob, nftCount)
        await squadBob.registerNFT(
            erc721.address, 
            nftCount,
            5000,
            weightsAddresses,
            weightsIds,
            weights,
            squadRights1.address,
            token1.address,
            ethers.utils.parseEther('10')
        )
        let license = await squad.getLicense(erc721.address, nftCount)
        assert.equal(length, license.weightsAddresses.length)
        assert.equal(length, license.weightsIds.length)
        assert.equal(length, license.weights.length)
        
        await token1Alice.approve(squadRights1.address, ethers.utils.parseEther('10'))
        await squadRights1Alice.buy(erc721.address, nftCount)
        assert.isTrue(await squadRights1.check(erc721.address, nftCount, alice))
    })
})
