import { ethers } from 'ethers'
import fs from 'fs'
import { ERC20Mintable__factory } from '../typechain/factories/ERC20Mintable__factory'
import { Royalties__factory } from '../typechain/factories/Royalties__factory'
import { ERC721Squad__factory } from '../typechain/factories/ERC721Squad__factory'
import { RevShareLicenseManager__factory } from '../typechain/factories/RevShareLicenseManager__factory'
import { PurchasableLicenseManager__factory } from '../typechain/factories/PurchasableLicenseManager__factory'

function getWallet(network: string): ethers.Wallet {
    console.log('PK', process.env.PK)
    const pk = (process.env.PK ? process.env.PK : "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
    const provider = ethers.getDefaultProvider(network)
    return new ethers.Wallet(pk, provider)
}

interface Addresses {
    ERC20Mintable?: string,
    Royalties: string,
    ERC721Squad: string,
    RevShareLicenseManager: string,
    PurchasableLicenseManager: string
}

function recordAddresses(addresses: Addresses, network: string) {
    if (network == "http://127.0.0.1:8545/" || "http://localhost:8545/") { network = "local" }
    let JSONAddresses
    try {
        JSONAddresses = JSON.parse(fs.readFileSync('addresses.json').toString())
    } catch (err) {
        JSONAddresses = {}
    }
    JSONAddresses[network] = addresses
    const JSONString = JSON.stringify(JSONAddresses)
    fs.writeFileSync('addresses.json', JSONString)
    console.log(`Wrote new addresses on network ${network} to addresses.json`)
}

function writeABIs(contractNames: string[]) {
    try { fs.mkdirSync('./abis') } catch (err) { console.log('Skipped creating /abis folder') }
    contractNames.forEach(contractName => {
        const abiJSON = JSON.parse(fs.readFileSync(
            `./artifacts/contracts/${contractName}.sol/${contractName}.json`).toString()
        ).abi
        fs.writeFileSync(`./abis/${contractName}.json`, JSON.stringify(abiJSON))
        console.log(`${contractName} ABI written to ./abis`)
    })
}

async function main() {
    const network = (process.env.NETWORK ? process.env.NETWORK : "http://127.0.0.1:8545/")
    const signer: ethers.Wallet = getWallet(network)

    const ERC20MintableFactory = new ERC20Mintable__factory(signer)
    const RoyaltiesFactory = new Royalties__factory(signer)
    const SquadNftFactory = new ERC721Squad__factory(signer)
    const RevSharelicenseManagerFactory = new RevShareLicenseManager__factory(signer)
    const PurchasableLicenseManagerFactory = new PurchasableLicenseManager__factory(signer)

    // only when deploying to local network or test networks
    const erc20 = await ERC20MintableFactory.deploy('Fake DAI', 'fDAI')
    console.log(`fDai deployed to ${erc20.address}`)

    const royalties = await RoyaltiesFactory.deploy(erc20.address)
    console.log(`Royalties deployed to ${royalties.address}`)

    const squadNft = await SquadNftFactory.deploy("Squad", "sNFT")
    console.log(`ERC721Squad deployed to ${squadNft.address}`)

    const revShareLicenseManager = await RevSharelicenseManagerFactory.deploy(
        "Revenue share license",
        squadNft.address
    )
    console.log(`RevShareLicenseManager deployed to ${revShareLicenseManager.address}`)

    const purchasableLicenseManager = await PurchasableLicenseManagerFactory.deploy(
        "Purchasable license",
        squadNft.address,
        erc20.address,
        royalties.address
    )
    console.log(`PurchasableLicenseManager deployed to ${purchasableLicenseManager.address}`)

    const addresses: Addresses = {
        ERC20Mintable: erc20.address,
        Royalties: royalties.address,
        ERC721Squad: squadNft.address,
        RevShareLicenseManager: revShareLicenseManager.address,
        PurchasableLicenseManager: purchasableLicenseManager.address
    }
    recordAddresses(addresses, network)

    writeABIs([
        "ERC20Mintable",
        "Royalties",
        "ERC721Squad",
        "RevShareLicenseManager",
        "PurchasableLicenseManager"
    ])
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});