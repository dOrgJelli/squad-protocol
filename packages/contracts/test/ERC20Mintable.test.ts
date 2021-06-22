import { ethers } from 'hardhat'
import { assert } from 'chai'

describe('ERC20Mintable', () => {
    let alice: string, erc20Mintable, erc20MintableAlice

    beforeEach(async () => {
        const wallets = await ethers.getSigners()
        alice = await wallets[1].getAddress()

        const ERC20Mintable = await ethers.getContractFactory('ERC20Mintable')
        erc20Mintable = await ERC20Mintable.deploy('test name', 'TST')

        erc20MintableAlice = erc20Mintable.connect(wallets[1])
    })

    it('lets the owner mint new tokens', async () => {
        // Alice's starting balance is 0
        assert((await erc20Mintable.balanceOf(alice)).eq(0), 'Wrong starting balance')

        // mint 1
        const amount = ethers.utils.parseEther('1')
        await erc20Mintable.mint(alice, amount)

        // check Alice's balance is 1
        assert((await erc20Mintable.balanceOf(alice)).eq(amount), 'Wrong ending balance')
    })
})