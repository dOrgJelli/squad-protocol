#!/bin/bash

set -e

ts-node config/prepareConfig.ts
mustache config/subgraphConfig.json subgraph.template.yaml > subgraph.yaml
yarn codegen
graph build
