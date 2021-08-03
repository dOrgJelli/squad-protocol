// to be run by yarn/npm command only

const fs = require("fs");

const addresses = JSON.parse(fs.readFileSync('../hardhat/addresses.json'))
fs.writeFileSync(
  './recipes/constants.json',
  JSON.stringify(addresses.local)
)
