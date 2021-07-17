# squad-protocol
Monorepo for Squad protocol contracts, subgraph, and APIs

# dev
in root: `yarn`

## contracts
### testing
in `packages/contracts`: `yarn test`

## subgraph

### local setup
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

### testing
After local setup, `yarn test` from the subgraph package.