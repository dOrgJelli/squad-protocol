/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import "@nomiclabs/hardhat-waffle"

module.exports = {
  solidity: "0.8.5",
  networks: {
    hardhat: {
      accounts: {
        mnemonic: "myth like bonus scare over problem client lizard pioneer submit female collect",
        path: "m/44'/60'/0'/0/",
        initialIndex: 0,
        count: 10
      }
    }/*,
    TODO find a good way to import secrets from outside the repo
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${config.ropsten.alchemyApiKey}`,
      accounts: [`0x${config.ropsten.privateKey}`]
    }*/
  }
}
