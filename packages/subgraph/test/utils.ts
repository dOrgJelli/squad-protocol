import { ethers } from 'ethers'
import axios from 'axios'
import BalanceTree from '../../hardhat/lib/balance-tree'

const PurchasableLicenseManagerAbi = require('../../hardhat/abis/PurchasableLicenseManager.json')
const RevShareLicenseManagerAbi = require('../../hardhat/abis/RevShareLicenseManager.json')
const SquadNFTAbi = require('../../hardhat/abis/ERC721Squad.json')
const ERC20Abi = require('../../hardhat/abis/ERC20Mintable.json')
const RoyaltiesAbi = require('../../hardhat/abis/Royalties.json')
const addresses = require('../../hardhat/addresses.json')

const APIURL = 'http://127.0.0.1:8000/subgraphs/name/squadgames/squad-POC-subgraph'
const ALICE_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const SQUAD_NFT_ADDR = addresses.local.ERC721Squad.toLowerCase()
const FDAI_ADDR = addresses.local.ERC20Mintable.toLowerCase()
const ROYALTIES_ADDR = addresses.local.Royalties.toLowerCase()
export const PURCHASABLE_LM_ADDR = addresses.local.PurchasableLicenseManager.toLowerCase()
export const REV_SHARE_LM_ADDR = addresses.local.RevShareLicenseManager.toLowerCase()
export const DEF_PRICE = ethers.utils.parseEther('10')
export const DEF_SHARE = 50

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/')
export const alice = new ethers.Wallet(
  ALICE_PK, 
  provider
)
const squadNft = new ethers.Contract(
  SQUAD_NFT_ADDR,
  SquadNFTAbi,
  provider
)
const royalties = new ethers.Contract(
  ROYALTIES_ADDR,
  RoyaltiesAbi,
  provider
)
const purchasableLicenseManager = new ethers.Contract(
  PURCHASABLE_LM_ADDR,
  PurchasableLicenseManagerAbi,
  provider
)
const revShareLicenseManager = new ethers.Contract(
  REV_SHARE_LM_ADDR,
  RevShareLicenseManagerAbi,
  provider
)
const fDai = new ethers.Contract(
  FDAI_ADDR,
  ERC20Abi,
  provider
)
const aliceRoyalties = royalties.connect(alice)
const alicePlm = purchasableLicenseManager.connect(alice)
const aliceRslm = revShareLicenseManager.connect(alice)
const aliceNft = squadNft.connect(alice)
const aliceFDai = fDai.connect(alice)

interface TokenData {
  contentURI: string,
  metadataURI: string
}

export const defTokenData: TokenData = {
  contentURI: 'example1.com',
  metadataURI: 'example2.com'
}

export interface NFT {
  address: string,
  id: ethers.BigNumber,
  blockCreated: number
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function mint(): Promise<NFT> {
  const id = await aliceNft.nextTokenId()
  const tx = await aliceNft.mint(alice.address, defTokenData)
  const res = await tx.wait()
  const nft: NFT = {
    address: squadNft.address.toLowerCase(), 
    id: id,
    blockCreated: res.blockNumber
  }
  return nft
}

export async function registerPL(nft: NFT, price: ethers.BigNumber, share: number) {
  await alicePlm.registerNFT(nft.address, nft.id, alice.address, price, share)
}

export async function unregisterPL(nft: NFT) {
  await alicePlm.unregisterNFT(nft.address, nft.id)
  await delay(5000)
}

export async function mintAndRegisterPL(): Promise<NFT> {
  const nft = await mint()
  await registerPL(nft, DEF_PRICE, DEF_SHARE)
  await delay(5000)
  return nft
}

export async function registerRSL(nft: NFT, share: number) {
  await aliceRslm.registerNFT(nft.address, nft.id, alice.address, share)
}

export async function unregisterRSL(nft: NFT) {
  await aliceRslm.unregisterNFT(nft.address, nft.id)
  await delay(5000)
}

export async function mintAndRegisterRSL(): Promise<NFT> {
  const nft = await mint()
  await registerRSL(nft, DEF_SHARE)
  await delay(5000)
  return nft
}

export async function getPurchasableLicense(nft: NFT): Promise<any> {
  return await purchasableLicenseManager.registeredNFTs(nft.address, nft.id)
}

export async function getRevShareLicense(nft: NFT): Promise<any> {
  return await revShareLicenseManager.registeredNFTs(nft.address, nft.id)
}

export async function mintDaiAndPurchase(nft: NFT, price: ethers.BigNumber): Promise<number> {
  await aliceFDai.mint(alice.address, price)
  await aliceFDai.approve(purchasableLicenseManager.address, price)
  const tx = await alicePlm.purchase(nft.address, nft.id, alice.address, 1)
  const res = await tx.wait()
  await delay(5000)
  return res.blockNumber
}

const PERCENTAGE_SCALE = 10e5
const ALICE_ALLOC = ethers.BigNumber.from(50 * PERCENTAGE_SCALE)
const balances = [
  {
    account: alice.address,
    allocation: ALICE_ALLOC
  },
  {
    account: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    allocation: ALICE_ALLOC
  }
]
const balanceTree: BalanceTree = new BalanceTree(balances)
export const ROOT = balanceTree.getHexRoot()
const PROOF = balanceTree.getHexProof(alice.address, ALICE_ALLOC)

export async function mintAndIncrement(): Promise<number> {
  await aliceFDai.mint(ROYALTIES_ADDR, DEF_PRICE)
  const tx = await aliceRoyalties.incrementWindow(ROOT)
  const res = await tx.wait()
  await delay(5000)
  return res.blockNumber
}

export async function getBalanceForWindow(index: number): Promise<number> {
  const windowFunds = await royalties.balanceForWindow(index)
  return Number(windowFunds)
}

export async function getTotalClaimableBalance(): Promise<ethers.BigNumber> {
  return await royalties.totalClaimableBalance()
}

export async function getCurrentWindow(): Promise<number> {
  return Number(await royalties.currentWindow())
}

interface ClaimRes {
  tx: ethers.Transaction,
  res: any
}

export async function claim(windowIndex: number): Promise<ClaimRes> {
  const tx = await aliceRoyalties.claim(
    windowIndex,
    alice.address,
    Number(ALICE_ALLOC),
    PROOF
  )
  const res = await tx.wait()
  await delay(5000)
  return { tx, res }
}

// GRAPH QUERIES

export function makeContentId(nft: NFT): string {
  let id = nft.id.toHexString()
  // BigNumber.toHexString always has at least two characters (01), but we want 
  // one character when id is less than 10
  if (id[2] == "0") { id = id.slice(0,2)+id.slice(3) }
  return `${nft.address}-${id}`.toLowerCase()
}

export function makeLicenseId(nft: NFT, licenseManagerAddress: string): string {
  return `${makeContentId(nft)}-${licenseManagerAddress.toLowerCase()}`
}

export async function querySquadNFT(nft: NFT) {
  const query = `{
    squadNFT(id: "${Number(nft.id)}") {
      id
      creator
      contentURI
      metadataURI
      blockCreated
    }
  }`
  return (await querySubgraph(query)).data.squadNFT
}

export async function queryContent(nft: NFT) {
  const contentId = makeContentId(nft)
  // console.log('querying content id: ', contentId)
  const query = `{
    content(id: "${contentId}") {
      id
      nftAddress
      nftId
      purchasableLicenses {
        id
      }
      revShareLicenses {
        id
      }
    }
  }`
  return (await querySubgraph(query)).data.content
}

export async function queryPurchasableLicenses(nft: NFT, licenseManagerAddress: string) {
  const contentId = makeContentId(nft)
  // console.log('querying content id: ', contentId)
  const query = `{
    content(id: "${contentId}") {
      purchasableLicenses(licenseManagerAddress: "${licenseManagerAddress}") {
        id
        licenseManagerAddress
        registrant
        price
        sharePercentage
        licenseTokenAddress
      }
    }
  }`
  return (await querySubgraph(query)).data.content.purchasableLicenses
}

export async function queryRevShareLicenses(nft: NFT, licenseManagerAddress: string) {
  const contentId = makeContentId(nft)
  const query = `{
    content(id: "${contentId}") {
      revShareLicenses(licenseManagerAddress: "${licenseManagerAddress}") {
        id
        licenseManagerAddress
        registrant
        minSharePercentage
      }
    }
  }`
  return (await querySubgraph(query)).data.content.revShareLicenses
}

export async function queryAllContent() {
  const query = `{
    contents {
      id
      nftAddress
      nftId
      purchasableLicenses {
        id
      }
      revShareLicenses {
        id
      }
    }
  }`
  return (await querySubgraph(query)).data.contents
}

export async function queryPurchases(nft: NFT, licenseManagerAddress: string) {
  const licenseId = makeLicenseId(nft, licenseManagerAddress)
  const query = `{
    purchasableLicense(id: "${licenseId}") {
      purchases {
        id
        purchaser
        licensesBought
        pricePaid
        licenseTokenAddress
        blockNumber
      }
    }
  }`
  return (await querySubgraph(query)).data.purchasableLicense.purchases
}

export async function queryWindow(id: string) {
  const query = `{
    window(id: "${id}") {
      index
      fundsAvailable
      merkleRoot
      blockNumber
    }
  }`
  return (await querySubgraph(query)).data.window
}

export async function queryTransfer(hash: string | undefined) {
  if (!hash) { throw 'Hash was undefined' }
  const query = `{
    transfer(id: "${hash}") {
      id 
      to
      amount
      totalClaimableBalance
      blockNumber
    }
  }`
  return (await querySubgraph(query)).data.transfer
}

async function querySubgraph(query: string) {
  let res
  try {
    res = (await axios.post(APIURL, { query })).data
  } catch (err) {
    console.error('Graph query error: ', err)
  }
  return res
}
