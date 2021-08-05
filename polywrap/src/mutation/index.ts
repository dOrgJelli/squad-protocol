import {
  Ethereum_Mutation,
  Ethereum_TxResponse,
  Input_mintNFT,
  Input_approve,
} from "./w3";

import { BigInt } from "@web3api/wasm-as"

export function mintNFT(input: Input_mintNFT): Ethereum_TxResponse {
  const data = `{\
    "contentURI": "${input.contentURI}",\
    "metadataURI": "${input.metadataURI}"\
  }`

  const res: Ethereum_TxResponse = Ethereum_Mutation.callContractMethod({
    connection: input.connection,
    address: input.contractAddress,
    method: "function mint(address,string,string) external returns(uint256)",
    args: [input.creatorAddress, input.contentURI, input.metadataURI]
  })

  return res
}

export function approve(input: Input_approve): Ethereum_TxResponse {
  const txResponse: Ethereum_TxResponse = Ethereum_Mutation.callContractMethod({
    address: input.address,
    method: "function approve(address spender,uint256 amount) returns(bool)",
    args: [input.spender, input.amount.toString()],
    connection: input.connection
  });
  return txResponse;
}
