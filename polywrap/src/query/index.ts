import {
  Ethereum_Query,
  Input_balanceOf,
  Input_allowance,
  Ipfs_Query,
  Input_getLastNftData
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

// for testing only, most likely
export function getLastNftData(input: Input_getLastNftData): string {
  const nextIdString = Ethereum_Query.callContractView({
    address: input.address,
    method: "function nextTokenId() view returns(uint256)",
    args: [],
    connection: input.connection
  })

  const id = BigInt.fromString(nextIdString).subInt(1).toString()

  const hash = Ethereum_Query.callContractView({
    address: input.address,
    method: "function contentURIs(uint256) view returns(string)",
    args: [id],
    connection: input.connection
  })

  return String.UTF8.decode(
    Ipfs_Query.catFile({ cid: hash })
  )
}