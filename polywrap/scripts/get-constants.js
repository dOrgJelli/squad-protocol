const fs = require("fs")

const network = process.env.NETWORK
const release = JSON.parse(
  fs.readFileSync(`./releases/${network}_latest.json`).toString()
)
const addresses = release.addresses

fs.writeFileSync(
  'recipes/constants.json',
  JSON.stringify(addresses)
)
