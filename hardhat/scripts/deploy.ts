import { ethers, network } from 'hardhat'
import fs from 'fs'
import { ERC20Mintable__factory } from '../typechain/factories/ERC20Mintable__factory'
import { Royalties__factory } from '../typechain/factories/Royalties__factory'
import { ERC721Squad__factory } from '../typechain/factories/ERC721Squad__factory'
import { RevShareLicenseManager__factory } from '../typechain/factories/RevShareLicenseManager__factory'
import { PurchasableLicenseManager__factory } from '../typechain/factories/PurchasableLicenseManager__factory'

import {
  getVersion,
  saveVersion,
  Release,
  SemVer,
  Addresses,
  bumpVersion,
  writeReleaseInfo
} from '@squad/lib'

function writeABIs(contractNames: string[]) {
    try {
      fs.mkdirSync('./abis')
    } catch (err) {
      console.log('Skipped creating /abis folder')
    }
    contractNames.forEach((contractName: string) => {
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

    let version = getVersion()
    bumpVersion("build", version.preRelease,
                `build-${Date.now()}`)
    const release: Release = {
      version: getVersion(),
      network: network.name,
      addresses
    }
    writeReleaseInfo(release, network.name)

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
})
