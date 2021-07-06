/**
 * Deploy outline:
 *  - deploy royalties
 *  - deploy mockmedia
 *  - deploy revsharelicensemanager pointing to mockmedia
 *  - deploy purchasablelicensemanager pointing to royalties and mockmedia
 * TODO figure out local zora instead of mockmedia
 */

async function main() {
    const ERC20 = await ethers.getContractFactory("ERC20Mintable")
    const Royalties = await ethers.getContractFactory("Royalties")
    const MockMedia = await ethers.getContractFactory("MockMedia")
    const RevSharelicenseManager = await ethers.getContractFactory("RevShareLicenseManager")
    const PurchasableLicenseManager = await ethers.getContractFactory("PurchasableLicenseManager")

    const fDai = await ERC20.deploy('Fake DAI', 'fDAI')
    console.log(`fDai deployed to ${fDai.address}`)

    const royalties = await Royalties.deploy(fDai.address)
    console.log(`Royalties deployed to ${royalties.address}`)

    const mockMedia = await MockMedia.deploy()
    console.log(`MockMedia deployed to ${mockMedia.address}`)

    const revShareLicenseManager = await RevSharelicenseManager.deploy(
        "Revenue share license",
        mockMedia.address
    )
    console.log(`RevShareLicenseManager deployed to ${revShareLicenseManager.address}`)

    const purchasableLicenseManager = await PurchasableLicenseManager.deploy(
        "Purchasable license",
        mockMedia.address,
        fDai.address,
        royalties.address
    )
    console.log(`PurchasableLicenseManager deployed to ${purchasableLicenseManager.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
});