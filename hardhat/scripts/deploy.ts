import hre from 'hardhat'
import fs from 'fs'
import { ERC20Mintable__factory } from '../typechain/factories/ERC20Mintable__factory'
import { Royalties__factory } from '../typechain/factories/Royalties__factory'
import { ERC721Squad__factory } from '../typechain/factories/ERC721Squad__factory'
import { RevShareLicenseManager__factory } from '../typechain/factories/RevShareLicenseManager__factory'
import { PurchasableLicenseManager__factory } from '../typechain/factories/PurchasableLicenseManager__factory'

const ethers = hre.ethers
const network = hre.network

interface Addresses {
    ERC20Mintable?: string,
    Royalties: string,
    ERC721Squad: string,
    RevShareLicenseManager: string,
    PurchasableLicenseManager: string
}

/*
 * Records addresses of the most recently deployed contracts by
 * network This is used by polywrap tests and other future processes
 * to connect to deployed contracts.
 *
 * A json file for each network is produced at
 * {network}-addresses.json as well as an aggregate file
 * addresses.json with a mapping from network -> addresses object
 *
 * The individual network files make things nice for test automation
 */
function recordAddresses(addresses: Addresses, network: string) {
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
    const networkFilename = `${network}-addresses.json`
    fs.writeFileSync(`${networkFilename}`, JSON.stringify(addresses))
    console.log(`Wrote new addresses on network ${network} to ${networkFilename}`)
}

// TODO consider moving this to it's own version management/release library
interface SemVer {
  major: bigint,
  minor: bigint,
  patch: bigint,
  preRelease?: string,
  build?: string
}

interface Release {
  version: SemVer,
  network: string,
  addresses: Addresses
}

function formatSemVer(v: SemVer): string {
  let versionString: string = `${v.major}-${v.minor}-${v.patch}`
  if (v.preRelease !== undefined) {
    versionString = `${versionString}-${v.preRelease}`
  }
  if(v.build !== undefined) {
    versionString = `${versionString}+${v.build}`
  }
  return versionString
}

function writeReleaseInfo(release: Release) {
  fs.writeFileSync(
    `../../releases/${formatSemVer(release.version)}.json`,
    JSON.stringify(release)
  )
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
    const signer = (await ethers.getSigners())[0]

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
