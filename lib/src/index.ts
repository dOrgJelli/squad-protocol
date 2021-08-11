import * as fs from 'fs'
import * as path from 'path'

const VERSION_PATH = process.env.VERSION_PATH ?? ""
if (VERSION_PATH == "") {
  throw new Error("could not find required config VERSION_PATH")
}

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

export function getVersion(): SemVer {
  if (!fs.existsSync(VERSION_PATH)) {
    return { major: 0, minor: 0, patch: 0 }
  }
  return JSON.parse(fs.readFileSync(VERSION_PATH).toString())
}

export function saveVersion(v: SemVer) {
  fs.writeFileSync(VERSION_PATH, JSON.stringify(v))
}

export function getLatestRelease(network: string): Release {
  const latestPath: string = `${path.dirname(VERSION_PATH)}/${network}-latest.json`
  if (!fs.existsSync(latestPath)) {
    throw new Error(`no release found at ${path}`)
  }
  return JSON.parse(fs.readFileSync(latestPath).toString())
}

/** bump the version up one. Level may be "build", "major", "minor", or
 *  "patch" A build bump does not bump the major, minor, or patch
 *  version but replaces the preRelease and build strings
 */
export function bumpVersion(level: string, preRelease?: string, build?: string) {
  let v = getVersion()
  const oldVersionString = formatSemVer(v)
  switch(level) {
    case "major": {
      v.major += 1
      v.minor = 0
      v.patch = 0
      v.preRelease = preRelease
      v.build = build
      break
    }
    case "minor": {
      v.minor += 1
      v.patch = 0
      v.preRelease = preRelease
      v.build = build
      break
    }
    case "patch": {
      v.patch += 1
      v.preRelease = preRelease
      v.build = build
      break
    }
    case "build": {
      v.preRelease = preRelease
      v.build = build
      break
    }
    default: {
      throw new Error(
        `expected bump level of 'major', 'minor', or 'patch' got '${level}'`
      )
      break
    }
  }
  const newVersionString = formatSemVer(v)
  console.log(
    `bumping version from ${oldVersionString} to ${newVersionString}`
  )
  saveVersion(v)
}

export function formatSemVer(v: SemVer): string {
  let versionString: string = `${v.major}.${v.minor}.${v.patch}`
  if (v.preRelease != undefined) {
    versionString = `${versionString}-${v.preRelease}`
  }
  if(v.build != undefined) {
    versionString = `${versionString}+${v.build}`
  }
  return versionString
}

// TODO make this configurable by network
export function writeReleaseInfo(release: Release, network: string) {
  const latestPath = `../releases/${network}_latest.json`
  fs.writeFileSync(VERSION_PATH, JSON.stringify(release))
  if (fs.existsSync(latestPath)) {
    fs.unlinkSync(latestPath)
  }
  fs.symlinkSync(VERSION_PATH, latestPath)
}
