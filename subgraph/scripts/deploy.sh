#!/bin/bash

set -e

yarn create:local
graph deploy squadgames/squad-POC-subgraph \
      --ipfs http://localhost:5001 \
      --node http://127.0.0.1:8020
