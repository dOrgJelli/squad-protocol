import * as fs from 'fs'

const network = (process.env.NETWORK ? process.env.NETWORK : "local")

const addresses = require('../../hardhat/addresses.json')

const configJSON = {
    network: network,
    erc721SquadAddress: addresses[network].ERC721Squad,
    erc721SquadAbi: "../hardhat/abis/ERC721Squad.json",
    purchasableLicenseManagerAddress: addresses[network].PurchasableLicenseManager,
    purchasableLicenseManagerAbi: "../hardhat/abis/PurchasableLicenseManager.json",
    revShareLicenseManagerAddress: addresses[network].RevShareLicenseManager,
    revShareLicenseManagerAbi: "../hardhat/abis/RevShareLicenseManager.json",
    royaltiesAddress: addresses[network].Royalties,
    royaltiesAbi: "../hardhat/abis/Royalties.json"
}

if (network == "local") { configJSON.network = "mainnet" }

fs.writeFileSync('./config/subgraphConfig.json', JSON.stringify(configJSON))

console.log(`Prepared config for network: ${network}`)
