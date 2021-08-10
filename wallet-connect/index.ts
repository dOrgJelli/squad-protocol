import WalletConnectProvider from "@walletconnect/web3-provider"
import { ethers }  from "ethers"
import axios from "axios"
// must compile the hardhat project to generate typechain files before running this
import { ERC20__factory } from "../hardhat/typechain/factories/ERC20__factory"
import { Web3ApiClient } from "@web3api/client-js"
import { ethereumPlugin } from '@web3api/ethereum-plugin-js'
import { ensPlugin } from "@web3api/ens-plugin-js"
import { ipfsPlugin } from "@web3api/ipfs-plugin-js"

const genAddress = "0x543ff227f64aa17ea132bf9886cab5db55dcaddf"

/**
 * Show:
 *  - app reacting to login
 *  - app sending tx request to wallet
 *  - app reacting to tx getting sent by wallet
 *  - app reacting to tx getting confirmed on-chain
 *  - that the QR code info can be customized
 */

async function main() {
  const provider = new WalletConnectProvider({
    // qrcode: false,
    rpc: {
      1: "https://eth-mainnet.alchemyapi.io/v2/z8_ZzOeeaoCxaxdsdxaKmf0Pv5pxiOAx"
    },
    clientMeta: {
      description: "squad protocol test",
      url: "test-url",
      icons: ["a", "b", "c"],
      name: "Squad Protocol",
    }
  })

  provider.connector.on("display_uri", (err, payload) => {
    console.log("connector display payload:", err, payload)
  })

  provider.on("connect", (err: Error | null, payload: any | null) => {
    console.log(
      "connected:", 
      err, 
      payload
      // provider
    )
  })

  provider.on("message", (err: Error | null, payload: any | null) => {
    console.log("message:", err, payload)
  })

  await provider.enable()

  const web3provider = new ethers.providers.Web3Provider(provider)
  const signer = web3provider.getSigner()

  // Fetch the test ENS address from the local chain
  const ensConfig = await axios.get("http://localhost:4040/ens")
  const ensAddress = ensConfig.data.ensAddress

  const client = new Web3ApiClient({
    plugins: [
      {
        uri: "/ens/ens.web3api.eth",
        plugin: ensPlugin({
          addresses: {
            testnet: ensAddress
          }
        })
      },
      {
        uri: "/ens/ethereum.web3api.eth",
        plugin: ethereumPlugin({
          networks: {
            testnet: {
              provider: "http://localhost:8545"
            }
          },
          // If defaultNetwork is not specified, mainnet will be used.
          defaultNetwork: "testnet"
        })
      },
      {
        uri: "/ens/ipfs.web3api.eth",
        plugin: ipfsPlugin({
          provider: "https://ipfs.io",
          fallbackProviders: ["https://localhost:5001"]
        }),
      }
    ]
  })
  console.log("polywrap client:", client)

  const GEN = ERC20__factory.connect(genAddress, signer)
  /*
  try {
    await GEN.transfer("0xb4124cEB3451635DAcedd11767f004d8a28c6eE7", ethers.utils.parseEther('10'))
  } catch (err) {
    console.error(err)
  }
  */

  const result = await client.query({
    uri: '/ens/testnet/squadprotocol.eth',
    query: `{
      approve(
        address: "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"
        spender: "0x3efF05A88A1d2aAb2C0bAD2c8E2FB3da0E5f1Ee9"
        amount: "10000000000"
      )
    }`
  })

  console.log("polywrap result:", result)

}

main()