import { ethers, network } from 'hardhat'
import fs from 'fs'
import { ERC20Mintable__factory } from '../typechain/factories/ERC20Mintable__factory'
import { Royalties__factory } from '../typechain/factories/Royalties__factory'
import { ERC721Squad__factory } from '../typechain/factories/ERC721Squad__factory'
import { RevShareLicenseManager__factory } from '../typechain/factories/RevShareLicenseManager__factory'
import { PurchasableLicenseManager__factory } from '../typechain/factories/PurchasableLicenseManager__factory'

const VERSION_PATH = "../../version.json"

import { getVersion, saveVersion, Release, SemVer, Addresses } from '@squad/lib'

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

// bump the version up one. Level may be "build", "major", "minor", or
// "patch" A build bump does not bump the major, minor, or patch
// version but replaces the preRelease and build strings
function bumpVersion(level: string, path: string, preRelease?: string, build?: string) {
  let v = getVersion(VERSION_PATH)
  const oldVersionString = formatSemVer(v)
  switch(level) {
    case "major": {
      v.major += 1
      v.minor = 0
      v.patch = 0
      v.preRelease = preRelease
      v.build = build
      break
    }
    case "minor": {
      v.minor += 1
      v.patch = 0
      v.preRelease = preRelease
      v.build = build
      break
    }
    case "patch": {
      v.patch += 1
      v.preRelease = preRelease
      v.build = build
      break
    }
    case "build": {
      v.preRelease = preRelease
      v.build = build
      break
    }
    default: {
      throw new Error(
        `expected bump level of 'major', 'minor', or 'patch' got '${level}'`
      )
      break
    }
  }
  const newVersionString = formatSemVer(v)
  console.log(
    `bumping version from ${oldVersionString} to ${newVersionString}`
  )
  saveVersion(v, path)
}

function formatSemVer(v: SemVer): string {
  let versionString: string = `${v.major}.${v.minor}.${v.patch}`
  if (v.preRelease != undefined) {
    versionString = `${versionString}-${v.preRelease}`
  }
  if(v.build != undefined) {
    versionString = `${versionString}+${v.build}`
  }
  return versionString
}

// TODO factor release management into a package
function writeReleaseInfo(release: Release) {
  const path =
    `../releases/${network.name}_${formatSemVer(release.version)}.json`
  const latestPath = `../releases/${network.name}_latest.json`
  fs.writeFileSync(path, JSON.stringify(release))
  if (fs.existsSync(latestPath)) {
    fs.unlinkSync(latestPath)
  }
  fs.symlinkSync(path, latestPath)
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
    const signer = (await ethers.getSigners())[0]

    const ERC20MintableFactory = new ERC20Mintable__factory(signer)
    const RoyaltiesFactory = new Royalties__factory(signer)
    const SquadNftFactory = new ERC721Squad__factory(signer)
    const RevSharelicenseManagerFactory = new RevShareLicenseManager__factory(signer)
    const PurchasableLicenseManagerFactory = new PurchasableLicenseManager__factory(signer)

    // only when deploying to local network or test networks
    // TODO what do we do for the ERC20 address when not using fake DAI?
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

    let version = getVersion(VERSION_PATH)
    bumpVersion("build", VERSION_PATH, version.preRelease,
                `build-${Date.now()}`)
    const release: Release = {
      version: getVersion(VERSION_PATH),
      network: network.name,
      addresses
    }
    writeReleaseInfo(release)
    recordAddresses(addresses, network.name)

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
