/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import fs from 'fs'

// TODO make secrets location configurable
const secretsPath = `${process.env.HOME}/.squad-secrets.json`
const config = JSON.parse(fs.readFileSync(secretsPath).toString())

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
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${config.ropsten.alchemyApiKey}`,
      accounts: [`${config.ropsten.privateKey}`]
    }
  }
}
