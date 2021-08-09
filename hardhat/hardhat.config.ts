/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import "@nomiclabs/hardhat-waffle"
import fs

const SQUAD_SECRETS_PATH = process.env.SQUAD_SECRETS_PATH
if (SQUAD_SECRETS_PATH === undefined) {
  SQUAD_SECRETS_PATH = "~/.squad-secrets.json"
}
try {
  const conf = JSON.parse(fs.readFileSync(SQUAD_SECRETS_PATH))
} catch {
  console.log("Please create a squad secrets file. See README.md"
}

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
      url: `https://eth-ropsten.alchemyapi.io/v2/${conf.ropsten.alchemyApiKey}`,
      accounts: [`0x${conf.ropsten.privateKey}`]
    }
  }
}
