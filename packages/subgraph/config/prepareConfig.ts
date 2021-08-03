import * as fs from 'fs'

const network = (process.env.NETWORK ? process.env.NETWORK : "local")

const addresses = require('../../eth/addresses.json')

const configJSON = {
    network: network,
    erc721SquadAddress: addresses[network].ERC721Squad,
    erc721SquadAbi: "../eth/abis/ERC721Squad.json",
    purchasableLicenseManagerAddress: addresses[network].PurchasableLicenseManager,
    purchasableLicenseManagerAbi: "../eth/abis/PurchasableLicenseManager.json",
    revShareLicenseManagerAddress: addresses[network].RevShareLicenseManager,
    revShareLicenseManagerAbi: "../eth/abis/RevShareLicenseManager.json",
    royaltiesAddress: addresses[network].Royalties,
    royaltiesAbi: "../eth/abis/Royalties.json"
}

if (network == "local") { configJSON.network = "mainnet" }

fs.writeFileSync('./config/subgraphConfig.json', JSON.stringify(configJSON))

console.log(`Prepared config for network: ${network}`)