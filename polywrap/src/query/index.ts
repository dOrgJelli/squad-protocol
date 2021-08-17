import {
  Ethereum_Query,
  Input_balanceOf,
  Input_allowance,
  Ipfs_Query,
  Input_getNftData
} from "./w3";

import { BigInt } from "@web3api/wasm-as"

export function balanceOf(input: Input_balanceOf): BigInt {
  const res = Ethereum_Query.callContractView({
    address: input.address,
    method: "function balanceOf(address account) view returns(uint256)",
    args: [input.account],
    connection: input.connection
  })
  return BigInt.fromString(res)
}

export function allowance(input: Input_allowance): BigInt {
  const res = Ethereum_Query.callContractView({
    address: input.address,
    method: "function allowance(address owner,address spender) view returns(uint256)",
    args: [input.owner, input.spender],
    connection: input.connection
  })
  return BigInt.fromString(res)
}

export function getNftData(input: Input_getNftData): string {
  const hash = Ethereum_Query.callContractView({
    address: input.address,
    method: "function contentURIs(uint256) view returns(string)",
    args: [input.id.toString()],
    connection: input.connection
  })

  return String.UTF8.decode(
    Ipfs_Query.catFile({ cid: hash })
  )
}