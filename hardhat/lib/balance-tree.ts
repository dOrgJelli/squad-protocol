// From Mirror.xyz

import MerkleTree from './merkle-tree'
import { BigNumber, utils } from 'ethers'

export default class BalanceTree {
  private readonly tree: MerkleTree
  constructor (balances: Array<{ account: string, allocation: BigNumber }>) {
    this.tree = new MerkleTree(
      balances.map(({ account, allocation }, index) => {
        return BalanceTree.toNode(account, allocation)
      })
    )
  }

  public static verifyProof (
    account: string,
    allocation: BigNumber,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = BalanceTree.toNode(account, allocation)
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item)
    }

    return pair.equals(root)
  }

  public static toNode (account: string, allocation: BigNumber): Buffer {
    return Buffer.from(
      utils
        .solidityKeccak256(['address', 'uint256'], [account, allocation])
        .substr(2),
      'hex'
    )
  }

  public getRoot (): Buffer {
    return this.tree.getRoot()
  }

  public getHexRoot (): string {
    return this.tree.getHexRoot()
  }

  // returns the Buffer values of the proof
  public getProof (
    account: string,
    allocation: BigNumber
  ): Buffer[] {
    return this.tree.getProof(BalanceTree.toNode(account, allocation))
  }

  // returns the hex bytes32 values of the proof
  public getHexProof (
    account: string,
    allocation: BigNumber
  ): string[] {
    return this.tree.getHexProof(BalanceTree.toNode(account, allocation))
  }
}
