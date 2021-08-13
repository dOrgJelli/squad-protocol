import * as fs from 'fs'
import * as path from 'path'
import { homedir } from 'os'
import { ethers } from 'ethers'

export type Contract = {
  address: string,
  abiPath: string
}

export type ContractInfo = {
  [index: string]: Contract
}

export type SquadProtocolConfig = {
  network: string,
  networkNameOrUrl: string,
  contracts: ContractInfo
}

export type SquadProtocolSecrets = {
  deployPrivateKey: string
}

const latestConfigPath = path.resolve(path.join("..", "squad-config.json"))

export function getConfig(path=latestConfigPath): any {
  return JSON.parse(fs.readFileSync(path).toString())
}

export function writeConfig(config: SquadProtocolConfig, id="default") {
  if (id == "default") {
    id = Date.now().toString()
  }
  const configFilename = `${config.network}-${id}.json`
  const configPath = path.resolve(
    path.join("..", "config", configFilename)
  )
  const data = JSON.stringify(config)
  fs.writeFileSync(configPath, data)
  fs.writeFileSync(latestConfigPath, data)
}

export function getSecrets(): any {
  const config = getConfig()
  const secretsDir =
    process.env.SQUAD_SECRETS_DIR || path.join(homedir(), ".squad/")
  const secretsPath = path.join(secretsDir, `${config.network}-secrets.json`)
  if (!fs.existsSync(secretsPath)) {
    throw new Error(`Could not find secrets at ${secretsPath}`)
  }
  try {
    const secrets = JSON.parse(fs.readFileSync(secretsPath).toString())
    return secrets
  } catch (e) {
    throw new Error(`Could not parse secrets at ${secretsPath}\n\n${e}`)
  }
}
