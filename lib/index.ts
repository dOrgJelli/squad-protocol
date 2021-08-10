import * as fs from 'fs'

export interface Addresses {
    ERC20Mintable?: string,
    Royalties: string,
    ERC721Squad: string,
    RevShareLicenseManager: string,
    PurchasableLicenseManager: string
}

export interface SemVer {
  major: number,
  minor: number,
  patch: number,
  preRelease?: string,
  build?: string
}

export interface Release {
  version: SemVer,
  network: string,
  addresses: Addresses
}

// TODO release paths should be configuration not parameters
export function getVersion(path: string): SemVer {
  if (!fs.existsSync(path)) {
    return { major: 0, minor: 0, patch: 0 }
  }
  return JSON.parse(fs.readFileSync(path).toString())
}

export function saveVersion(v: SemVer, path: string) {
  fs.writeFileSync(path, JSON.stringify(v))
}

export function getLatestRelease(network: string, releasesPath: string): Release {
  const path = `${releasesPath}/${network}_latest.json`
  if (!fs.existsSync(path)) {
    throw new Error(`no release found at ${path}`)
  }
  return JSON.parse(fs.readFileSync(path).toString())
}

