# squad-protocol
Monorepo for Squad protocol contracts, subgraph, and APIs

# dev
in root: `yarn`

## contracts
### testing
in `packages/eth`: `yarn test`

### deploying
in `packages/eth`:
1. If deploying locally, in tab 1: `npx hardat node`
2. In tab 2: `PK={your_private_key} NETWORK={network} yarn deploy`. Leaving PK and network blank defaults to local PK and network. Other options: homestead (mainnet), ropsten, rinkeby, etc.

## subgraph

### local setup
In root:
`yarn` or `yarn install`

Processes you must have running:
- hardhat local network node
- contracts deployed to hardhat node (using `yarn deploy` script)
- graph-node docker-compose-up

Then, in this package:
`yarn prepare-local`
`yarn codegen`
`yarn build`
`yarn create-local`
`yarn deploy-local`

### testing
After local setup, `yarn test` from the subgraph package.