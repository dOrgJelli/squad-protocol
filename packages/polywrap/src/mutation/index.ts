import {
  Ethereum_Mutation,
  Input_mintNFT
} from "./w3";
import { BigInt } from "@web3api/wasm-as"

export function mintNFT(input: Input_mintNFT): string {
  const data = `{\
    "contentURI": "${input.contentURI}",\
    "metadataURI": "${input.metadataURI}"\
  }`

  const res = Ethereum_Mutation.callContractMethod({
    connection: input.connection,
    address: input.contractAddress,
    method: "function mint(address creator, tuple data) external returns(uint256)",
    args: [input.creatorAddress, data]
  })

  return res.hash
}
