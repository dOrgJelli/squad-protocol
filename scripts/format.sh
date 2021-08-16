#!/bin/bash

echo "formatting @squad/hardhat"
yarn workspace @squad/hardhat format
echo "formatting @squad/polywrap"
yarn workspace @squad/polywrap format
echo "formatting @squad/subgraph"
yarn workspace @squad/subgraph format
echo "formatting @squad/lib"
yarn workspace @squad/lib format
