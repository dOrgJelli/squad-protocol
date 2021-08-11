import * as fs from 'fs'

const network = (process.env.NETWORK ? process.env.NETWORK : "localhost")

const release = require(`../releases/${network}_latest.json`)

const configJSON = {
    network: network,
    erc721SquadAddress: release.addresses.ERC721Squad,
    erc721SquadAbi: "../hardhat/abis/ERC721Squad.json",
    purchasableLicenseManagerAddress: release.addresses.PurchasableLicenseManager,
    purchasableLicenseManagerAbi: "../hardhat/abis/PurchasableLicenseManager.json",
    revShareLicenseManagerAddress: release.addresses.RevShareLicenseManager,
    revShareLicenseManagerAbi: "../hardhat/abis/RevShareLicenseManager.json",
    royaltiesAddress: release.addresses.Royalties,
    royaltiesAbi: "../hardhat/abis/Royalties.json"
}

// TheGraph is weird and wants to address the local network as mainnet :shrug:
// :/
if (network == "localhost") { configJSON.network = "mainnet" }

fs.writeFileSync('./config/subgraphConfig.json', JSON.stringify(configJSON))

console.log(`Prepared subgraph config for network: ${network}`)
