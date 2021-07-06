# Squad POC Subgraph

## Dev set up
In root:
`yarn` or `yarn install`

Processes you must have running:
- hardhat local network node
- contracts deployed to hardhat node
- graph-node docker-compose-up

Then, in this package:
`yarn codegen`
`yarn build`
`yarn create-local`
`yarn deploy-local`