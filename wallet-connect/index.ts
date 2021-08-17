import WalletConnectProvider from '@walletconnect/web3-provider'
import { ethers } from 'ethers'
// must compile the hardhat project to generate typechain files before running this
import { ERC20__factory } from '../hardhat/typechain/factories/ERC20__factory'

const genAddress = '0x543ff227f64aa17ea132bf9886cab5db55dcaddf'

/**
 * Show:
 *  - app reacting to login
 *  - app sending tx request to wallet
 *  - app reacting to tx getting sent by wallet
 *  - app reacting to tx getting confirmed on-chain
 *  - that the QR code info can be customized
 */

async function main (): Promise<void> {
  const provider = new WalletConnectProvider({
    // qrcode: false,
    rpc: {
      1: 'https://eth-mainnet.alchemyapi.io/v2/z8_ZzOeeaoCxaxdsdxaKmf0Pv5pxiOAx'
    }
  })

  provider.connector.on('display_uri', (err, payload) => {
    console.log('connector display payload:', err, payload)
  })

  provider.on('connect', (err: Error | null, payload: any | null) => {
    console.log(
      'connected:',
      err,
      payload,
      provider
    )
  })

  provider.on('message', (err: Error | null, payload: any | null) => {
    console.log('message:', err, payload)
  })

  await provider.enable()

  const web3provider = new ethers.providers.Web3Provider(provider)
  const signer = web3provider.getSigner()

  const GEN = ERC20__factory.connect(genAddress, signer)
  try {
    await GEN.transfer('0xb4124cEB3451635DAcedd11767f004d8a28c6eE7', ethers.utils.parseEther('10'))
  } catch (err) {
    console.error(err)
  }
}

main().then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error)
    process.exit(1)
  })
