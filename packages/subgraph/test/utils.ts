import { ethers } from 'ethers'
import axios from 'axios'
import BalanceTree from '../../contracts/scripts/lib/balance-tree'

const PurchasableLicenseManagerAbi = require('../abis/PurchasableLicenseManager.json')
const RevShareLicenseManagerAbi = require('../abis/RevShareLicenseManager.json')
const MockMediaAbi = require('../abis/MockMedia.json')
const ERC20Abi = require('../abis/ERC20Mintable.json')
const RoyaltiesAbi = require('../abis/Royalties.json')

const APIURL = 'http://127.0.0.1:8000/subgraphs/name/squadgames/squad-POC-subgraph'
const ALICE_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const MEDIA_ADDR = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'.toLowerCase()
const FDAI_ADDR = '0x5FbDB2315678afecb367f032d93F642f64180aa3'.toLowerCase()
const ROYALTIES_ADDR = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'.toLowerCase()
export const PURCHASABLE_LM_ADDR = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'.toLowerCase()
export const REV_SHARE_LM_ADDR = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'.toLowerCase()
export const DEF_PRICE = ethers.utils.parseEther('10')
export const DEF_SHARE = 50

const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/')
export const alice = new ethers.Wallet(
  ALICE_PK, 
  provider
)
const mockMedia = new ethers.Contract(
  MEDIA_ADDR,
  MockMediaAbi,
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
const aliceMedia = mockMedia.connect(alice)
const aliceFDai = fDai.connect(alice)

const mediaData = {
  tokenURI: 'example1.com',
  metadataURI: 'example2.com',
  contentHash: ethers.utils.keccak256('0x123456'),
  metadataHash: ethers.utils.keccak256('0x123467')
}

const bidShares = {
  creator: { value: ethers.BigNumber.from('10') }, 
  owner: { value: ethers.BigNumber.from('70') }, 
  prevOwner: { value: ethers.BigNumber.from('20') }
}

export interface NFT {
  address: string,
  id: ethers.BigNumber
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function mint(): Promise<NFT> {
  const balance = Number(await aliceMedia.balanceOf(alice.address))
  await aliceMedia.mint(mediaData, bidShares)
  const nftId = await aliceMedia.tokenOfOwnerByIndex(alice.address, balance)
  return {
    address: mockMedia.address.toLowerCase(), 
    id: nftId
  }
}

export async function registerPL(nft: NFT, price: ethers.BigNumber, share: number) {
  await alicePlm.registerNFT(nft.address, nft.id, price, share)
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
  await aliceRslm.registerNFT(nft.address, nft.id, share)
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

// TODO typechain stuff...
export async function getPurchasableLicense(nft: NFT): Promise<any> {
  return await purchasableLicenseManager.registeredNFTs(nft.address, nft.id)
}

export async function getRevShareLicense(nft: NFT): Promise<any> {
  return await revShareLicenseManager.registeredNFTs(nft.address, nft.id)
}

export async function mintDaiAndPurchase(nft: NFT, price: ethers.BigNumber) {
  await aliceFDai.mint(alice.address, price)
  await aliceFDai.approve(purchasableLicenseManager.address, price)
  await alicePlm.purchase(nft.address, nft.id, alice.address, 1)
  await delay(5000)
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

export async function mintAndIncrement() {
  await aliceFDai.mint(ROYALTIES_ADDR, DEF_PRICE)
  await aliceRoyalties.incrementWindow(ROOT)
  await delay(5000)
}

export async function getBalanceForWindow(index): Promise<number> {
  const windowFunds = await royalties.balanceForWindow(index)
  return Number(windowFunds)
}

export async function getTotalClaimableBalance(): Promise<ethers.BigNumber> {
  return await royalties.totalClaimableBalance()
}

export async function getCurrentWindow(): Promise<number> {
  return Number(await royalties.currentWindow())
}

export async function claim(windowIndex: number): Promise<ethers.Transaction> {
  const tx = await aliceRoyalties.claim(
    windowIndex,
    alice.address,
    Number(ALICE_ALLOC),
    PROOF
  )
  await delay(5000)
  return tx
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

export async function queryWindow(id) {
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

export async function queryTransfer(hash) {
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