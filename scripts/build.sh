#!/bin/bash

set -e

echo
echo
echo "Building Squad Protocol"
echo
echo

yarn workspace @squad/lib build
echo
yarn workspace @squad/hardhat build
echo
yarn workspace @squad/hardhat deploy
echo
yarn workspace @squad/subgraph build
echo
yarn workspace @squad/polywrap build
