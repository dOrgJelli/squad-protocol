# squad-protocol
Monorepo for Squad protocol contracts, subgraph, and APIs

# dev
in root: `yarn`

## eth
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

## polywrap

### testing
We are not keeping our contracts in this package (they are in the "eth" package), so the testing flow for polywrap will look something like this. In the polywrap package:
1. `yarn build:web3api` (contracts should be compiled in the `eth` package)
2. `yarn test:env:up`
3. `yarn deploy` (will use the `eth` package's deploy script to deploy to polywrap's docker env)
4. `yarn test`