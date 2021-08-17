#!/bin/bash

set -e

yarn workspace @squad/subgraph deploy
yarn workspace @squad/polywrap deploy
