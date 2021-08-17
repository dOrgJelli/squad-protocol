#!/bin/bash

set -e

graph deploy squadgames/squad-POC-subgraph \
      --ipfs https://api.thegraph.com/ipfs/ \
      --node https://api.thegraph.com/deploy/

