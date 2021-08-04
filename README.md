# squad-protocol
Monorepo for Squad protocol contracts, subgraph, and APIs

# Local Dev Environment

Before you start, install the dependencies in the root of the project

`$ yarn`

To stand up a **full local dev environment**

`$ yarn up`

To run all tests

`$ yarn test`

To run workspace specific tests run either

`$ yarn test:hardhat` or `yarn test:polywrap`

(and in the future `yarn test:subgraph`)

To tear down the local dev environment

`$ yarn down`

## hardhat

If you are working only in the hardhat workspace and don't need to
stand up a full dev environment use the following in `packages/hardhat`.

To set up a hardhat only development environment

first start a hardhat node. NOTE: This is a hardhat node which is a
different local test chain than what you'll get with the project's
root level `yarn up` which uses polywrap's dev environment.

`packages/hardhat $ yarn up`

Then in another shell or shell tab

`packages/hardhat $ yarn deploy:local`

to run the tests

`packages/hardhat $ yarn test`

## subgraph

### local setup
In root:
`yarn` or `yarn install`

Processes you must have running:
- hardhat local network node (satisfied by `yarn up`)
- contracts deployed to hardhat node (satisfied by `yarn up`)
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

As polywrap development depends on othwer workspaces use the full
local dev environment as described above.

### testing

To run the polywrap tests from `packages/polywrap` run

`packages/polywrap $ yarn test`

You can also run just the polywrap tests from the project root with

`$ yarn test:polywrap`

