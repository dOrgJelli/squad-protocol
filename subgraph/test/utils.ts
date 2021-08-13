import { ethers } from 'ethers'
import axios from 'axios'
import BalanceTree from '../../hardhat/lib/balance-tree'
import { getConfig, getSecrets } from '@squad/lib'

const config = getConfig()
const secrets = getSecrets()
const contracts = config.contracts

const PurchasableLicenseManagerAbi =
  require(contracts.PurchasableLicenseManager.abiPath).abi
const RevShareLicenseManagerAbi =
  require(contracts.RevShareLicenseManager.abiPath).abi
const SquadNFTAbi = require(contracts.ERC721Squad.abiPath).abi
const ERC20Abi = require(contracts.ERC20Mintable.abiPath).abi
const RoyaltiesAbi = require(contracts.Royalties.abiPath).abi

const APIURL =
  'http://127.0.0.1:8000/subgraphs/name/squadgames/squad-POC-subgraph'

const SQUAD_NFT_ADDR = contracts.ERC721Squad.address.toLowerCase()
const FDAI_ADDR = contracts.ERC20Mintable.address.toLowerCase()
const ROYALTIES_ADDR = contracts.Royalties.address.toLowerCase()
const PERCENTAGE_SCALE = 10e5
const ALICE_ALLOC = ethers.BigNumber.from(50 * PERCENTAGE_SCALE)

export const PURCHASABLE_LM_ADDR =
  contracts.PurchasableLicenseManager.address.toLowerCase()
export const REV_SHARE_LM_ADDR =
  contracts.RevShareLicenseManager.address.toLowerCase()
export const DEF_PRICE = ethers.utils.parseEther('10')
export const DEF_SHARE = 50

const provider = ethers.getDefaultProvider(config.networkNameOrUrl)

let i=0

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

// TODO revert subgraph test utils signer and contract connections to sync
export const signer = new ethers.Wallet(secrets.deployPrivateKey, provider)

export async function getSigner() {
  return signer
}

export async function getAddress() {
  return signer.address
}

const getAliceRoyalties = async () => {
  return royalties.connect(await getSigner())
}
const getAlicePlm = async () => {
  return purchasableLicenseManager.connect(await getSigner())
}
const getAliceRslm = async () => {
  return revShareLicenseManager.connect(await getSigner())
}
const getAliceNft = async () => {
  return squadNft.connect(await getSigner())
}
const getAliceFDai = async () => {
  return fDai.connect(await getSigner())
}

interface TokenData {
  contentURI: string,
  metadataURI: string,
  contentHash: ethers.BytesLike,
  metadataHash: ethers.BytesLike
}

export const defTokenData: TokenData = {
  contentURI: 'example1.com',
  metadataURI: 'example2.com',
  contentHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('content')),
  metadataHash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes('metadata'))
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
  const aliceNft = await getAliceNft()
  const id = await aliceNft.nextTokenId()
  const tx = await aliceNft.mint(
    await getAddress(),
    defTokenData.contentURI,
    defTokenData.metadataURI,
    defTokenData.contentHash,
    defTokenData.metadataHash
  )
  const res = await tx.wait()
  const nft: NFT = {
    address: squadNft.address.toLowerCase(),
    id: id,
    blockCreated: res.blockNumber
  }
  return nft
}

export async function registerPL(nft: NFT, price: ethers.BigNumber, share: number) {
  const alicePlm = await getAlicePlm()
  await alicePlm.registerNFT(nft.address, nft.id, await getAddress(), price, share)
}

export async function unregisterPL(nft: NFT) {
  const alicePlm = await getAlicePlm()
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
  const aliceRslm = await getAliceRslm()
  await aliceRslm.registerNFT(nft.address, nft.id, await getAddress(), share)
}

export async function unregisterRSL(nft: NFT) {
  const aliceRslm = await getAliceRslm()
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
  const aliceFDai = await getAliceFDai()
  await aliceFDai.mint(await getAddress(), price)
  await aliceFDai.approve(purchasableLicenseManager.address, price)
  const alicePlm = await getAlicePlm()
  const tx = await alicePlm.purchase(nft.address, nft.id, await getAddress(), 1)
  const res = await tx.wait()
  await delay(5000)
  return res.blockNumber
}

export async function mintAndIncrement(): Promise<number> {
  const proofInfo = await getProofInfo()
  const aliceFDai = await getAliceFDai()
  await aliceFDai.mint(ROYALTIES_ADDR, DEF_PRICE)
  const aliceRoyalties = await getAliceRoyalties()
  const tx = await aliceRoyalties.incrementWindow(proofInfo.ROOT)
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

export async function getProofInfo () {
  const balances = [
    {
      account: await getAddress(),
      allocation: ALICE_ALLOC
    },
    {
      account: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      allocation: ALICE_ALLOC
    }
  ]
  const balanceTree: BalanceTree = new BalanceTree(balances)
  const ROOT = balanceTree.getHexRoot()
  const PROOF = balanceTree.getHexProof(await getAddress(), ALICE_ALLOC)
  return { ROOT, PROOF }
}

export async function claim(windowIndex: number): Promise<ClaimRes> {
  const aliceRoyalties = await getAliceRoyalties()
  const proofInfo = await getProofInfo()
  const tx = await aliceRoyalties.claim(
    windowIndex,
    await getAddress(),
    Number(ALICE_ALLOC),
    proofInfo.PROOF
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
