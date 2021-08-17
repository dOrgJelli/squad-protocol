import BalanceTree from './balance-tree'
import { ethers } from 'ethers'

const wallets: ethers.Wallet[] = []
const balances: Array<{ account: string, allocation: ethers.BigNumber }> = []

for (let i = 0; i <= 3; i++) {
  wallets.push(ethers.Wallet.createRandom())
  balances.push({
    account: wallets[i].address,
    allocation: ethers.BigNumber.from('25')
  })
}

const balanceTree: BalanceTree = new BalanceTree(balances)

console.log(balanceTree)

const proof: Buffer[] = balanceTree.getProof(balances[0].account, balances[0].allocation)

console.log(proof)

console.log(BalanceTree.verifyProof(
  balances[0].account,
  balances[0].allocation,
  proof,
  balanceTree.getRoot()
))
