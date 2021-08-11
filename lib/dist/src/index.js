"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeReleaseInfo = exports.formatSemVer = exports.bumpVersion = exports.getLatestRelease = exports.saveVersion = exports.getVersion = void 0;
const fs = require("fs");
const path = require("path");
const VERSION_PATH = (_a = process.env.VERSION_PATH) !== null && _a !== void 0 ? _a : "";
if (VERSION_PATH == "") {
    throw new Error("could not find required config VERSION_PATH");
}
function getVersion() {
    if (!fs.existsSync(VERSION_PATH)) {
        return { major: 0, minor: 0, patch: 0 };
    }
    return JSON.parse(fs.readFileSync(VERSION_PATH).toString());
}
exports.getVersion = getVersion;
function saveVersion(v) {
    fs.writeFileSync(VERSION_PATH, JSON.stringify(v));
}
exports.saveVersion = saveVersion;
function getLatestRelease(network) {
    const latestPath = `${path.dirname(VERSION_PATH)}/${network}-latest.json`;
    if (!fs.existsSync(latestPath)) {
        throw new Error(`no release found at ${path}`);
    }
    return JSON.parse(fs.readFileSync(latestPath).toString());
}
exports.getLatestRelease = getLatestRelease;
/** bump the version up one. Level may be "build", "major", "minor", or
 *  "patch" A build bump does not bump the major, minor, or patch
 *  version but replaces the preRelease and build strings
 */
function bumpVersion(level, preRelease, build) {
    let v = getVersion();
    const oldVersionString = formatSemVer(v);
    switch (level) {
        case "major": {
            v.major += 1;
            v.minor = 0;
            v.patch = 0;
            v.preRelease = preRelease;
            v.build = build;
            break;
        }
        case "minor": {
            v.minor += 1;
            v.patch = 0;
            v.preRelease = preRelease;
            v.build = build;
            break;
        }
        case "patch": {
            v.patch += 1;
            v.preRelease = preRelease;
            v.build = build;
            break;
        }
        case "build": {
            v.preRelease = preRelease;
            v.build = build;
            break;
        }
        default: {
            throw new Error(`expected bump level of 'major', 'minor', or 'patch' got '${level}'`);
            break;
        }
    }
    const newVersionString = formatSemVer(v);
    console.log(`bumping version from ${oldVersionString} to ${newVersionString}`);
    saveVersion(v);
}
exports.bumpVersion = bumpVersion;
function formatSemVer(v) {
    let versionString = `${v.major}.${v.minor}.${v.patch}`;
    if (v.preRelease != undefined) {
        versionString = `${versionString}-${v.preRelease}`;
    }
    if (v.build != undefined) {
        versionString = `${versionString}+${v.build}`;
    }
    return versionString;
}
exports.formatSemVer = formatSemVer;
// TODO make this configurable by network
function writeReleaseInfo(release, network) {
    const latestPath = `../releases/${network}_latest.json`;
    fs.writeFileSync(VERSION_PATH, JSON.stringify(release));
    if (fs.existsSync(latestPath)) {
        fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(VERSION_PATH, latestPath);
}
exports.writeReleaseInfo = writeReleaseInfo;
//# sourceMappingURL=index.js.map