const fs = require("fs")

const getConfig = require("@squad/lib").getConfig

const config = getConfig()

const addresses = {}
Object.entries(config.contracts).forEach(([contractName, contractInfo]) => {
  const address = {}
  address[contractName] = contractInfo.address
  Object.assign(addresses, address)
})

fs.writeFileSync(
  'recipes/constants.json',
  JSON.stringify(addresses)
)
