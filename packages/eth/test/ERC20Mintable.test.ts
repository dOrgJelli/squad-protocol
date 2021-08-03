import { ethers } from 'hardhat'
import { assert } from 'chai'
import { ERC20Mintable } from '../typechain/ERC20Mintable'
import { ERC20Mintable__factory } from '../typechain/factories/ERC20Mintable__factory'

describe('ERC20Mintable', () => {
    let aliceAddress: string
    let erc20Mintable: ERC20Mintable

    beforeEach(async () => {
        const signers = await ethers.getSigners()
        aliceAddress = await signers[1].getAddress()

        const ERC20MintableFactory = new ERC20Mintable__factory(signers[0])
        erc20Mintable = await ERC20MintableFactory.deploy('test name', 'TST')
    })

    it('lets the owner mint new tokens', async () => {
        // Alice's starting balance is 0
        assert((await erc20Mintable.balanceOf(aliceAddress)).eq(0), 'Wrong starting balance')

        // mint 1
        const amount = ethers.utils.parseEther('1')
        await erc20Mintable.mint(aliceAddress, amount)

        // check Alice's balance is 1
        assert((await erc20Mintable.balanceOf(aliceAddress)).eq(amount), 'Wrong ending balance')
    })
})