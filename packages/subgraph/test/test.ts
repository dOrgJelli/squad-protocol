/**
 * 
 * a full local subgraph + contracts must be deployed before running tests (see README)
 * 
 * The specification of these tests:
 * - on NFTRegistered
 *    - License is added to content in subgraph
 * 
 * - on NFTUnregistered
 *    - License is removed from content in subgraph
 * 
 * - on Purchase
 *    - Purchase event is added to subgraph
 * 
 * - on TransferToken
 *    - Token transfer is added to subgraph
 *    - Total unclaimed in royalties is reduced in subgraph
 * 
 * - on WindowIncremented
 *    - new window is added to subgraph, at the correct index
 * 
 * http://127.0.0.1:8000/subgraphs/name/squadgames/squad-POC-subgraph/graphql
 * 
 * fDai deployed to 0x5FbDB2315678afecb367f032d93F642f64180aa3
 * Royalties deployed to 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
 * MockMedia deployed to 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
 * RevShareLicenseManager deployed to 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
 * PurchasableLicenseManager deployed to 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
 * 
 * Hardhat accounts
 * Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
 * Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 * 
 * Account #1: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (10000 ETH)
 * Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
 * 
 * Account #2: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc (10000 ETH)
 * Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
 * 
 * Account #3: 0x90f79bf6eb2c4f870365e785982e1f101e93b906 (10000 ETH)
 * Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
 */

import { ethers } from 'ethers'
import { assert, expect } from 'chai'
import axios from 'axios'
import PurchasableLicenseManagerAbi = require('../abis/PurchasableLicenseManager.json')
import MockMediaAbi = require('../abis/MockMedia.json')

const APIURL = 'http://127.0.0.1:8000/subgraphs/name/squadgames/squad-POC-subgraph'

describe('PurchasableLicenseManager mapping', () => {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/')
  const alice = new ethers.Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', 
    provider
  )
  const mockMedia = new ethers.Contract(
    '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    MockMediaAbi,
    provider
  )
  const purchasableLicenseManager = new ethers.Contract(
    '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    PurchasableLicenseManagerAbi,
    provider
  )

  const aliceMedia = mockMedia.connect(alice)
  const alicePlm = purchasableLicenseManager.connect(alice)

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

  async function contentLicenses (nftAddress, nftId) {
    let licenses
    const query = `{
      licenses(first: 10) {
        id
        content
      }
      contents(first: 10) {
        id
        licenses
      }
    }`
    try {
      licenses = (await axios.post(APIURL, { query })).data.data
      console.log('graph query licenses', licenses)
    } catch (err) {
      console.error('Graph query error', err)
    }
    return licenses
  }

  it('should add a license on NFTRegistered event', async () => {

    const balance = Number(await aliceMedia.balanceOf(alice.address))
    console.log(balance)
    await aliceMedia.mint(mediaData, bidShares)
    const nftId = await aliceMedia.tokenOfOwnerByIndex(alice.address, balance)
    console.log(nftId)
    
    await alicePlm.registerNFT(mockMedia.address, nftId, 10, 50)

    const data = await contentLicenses(mockMedia.address, nftId)

    assert.equal(0, 1)
    
  })
})

/**
async function licensesOf (address) {
  let licenses
  const query = `{
    licenses(where: { owner: "${address}" }) {
      id
      owner
      amount
      contribution {
        id
        supply
        feeRate
      }
    }
  }`
  try {
    licenses = (await axios.post(url, { query })).data.data.licenses
    console.log('graph query licenses', licenses)
  } catch (err) {
    console.error('Graph query error', err)
  }
  return licenses
}
 */