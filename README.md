# squad-protocol
Monorepo for Squad protocol contracts, subgraph, and APIs

# Local Dev Environment

Before you start, install the dependencies in the root of the project
and create your secrets file.

`$ yarn`

create a file in your home folder called `.squad-secrets.json`. Look
in `hardhat.config.ts` for more details about what it'll need, but you
can start by adding something like this

```
{
        "ropsten": {
                   "privateKey": "...",
                   "alchemyApiKey": "...",
        }
}
```

To stand up a **full local dev environment**

`$ yarn up`

To run all tests

`$ yarn test`

To run workspace specific tests run either

`$ yarn test:hardhat`,  `yarn test:polywrap`, or `yarn test:subgraph`

To tear down the local dev environment

`$ yarn down`

## hardhat

If you are working only in the hardhat workspace and don't need to
stand up a full dev environment use the following in `hardhat`.

To set up a hardhat only development environment

first start a hardhat node. NOTE: This is a hardhat node which is a
different local test chain than what you'll get with the project's
root level `yarn up`, which uses polywrap's dev environment.

`hardhat $ yarn up`

Then in another shell or shell tab

`hardhat $ yarn deploy:local`

to run the tests

`hardhat $ yarn test`

## subgraph

Processes you must have running:
- hardhat local network node (satisfied by `yarn up`)
- contracts deployed to hardhat node (satisfied by `yarn up`)

Then, in this package:
`subgraph $ yarn up:standalone`
`subgraph $ yarn build:all`
`subgraph $ yarn deploy:local`

### testing

After the above setup

`subgraph $ yarn test:all`

## polywrap

As polywrap development depends on othwer workspaces use the full
local dev environment as described above.

### testing

To run the polywrap tests from `polywrap` run

`polywrap $ yarn test`

You can also run just the polywrap tests from the project root with

`polywrap $ yarn test:polywrap`

# Squad Protocol Packages Overview

## Ethereum Smart Contracts

Our smart contracts are managed by hardhat in `/hardhat`.

## API

The api is built from a Polywrap project `/polywrap` which depends on
a subgraph `/subgraph`.


