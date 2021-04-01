/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const ROPSTEN_PRIVATE_KEY = 'placeholder'

module.exports = {
  solidity: "0.8.3",

  defaultNetwork: "localhost",
  networks: {
    hardhat: {
    },
    /*
    ropsten: {
      url: "https://ropsten.infura.io/v3/46801402492348e480a7e18d9830eab8",
      accounts: [`0x${ROPSTEN_PRIVATE_KEY}`]
    }
    */
  }
}
