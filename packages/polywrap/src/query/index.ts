import {
  Ethereum_Query,
  Input_balanceOf,
  Input_allowance
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
