export interface Addresses {
    ERC20Mintable?: string;
    Royalties: string;
    ERC721Squad: string;
    RevShareLicenseManager: string;
    PurchasableLicenseManager: string;
}
export interface SemVer {
    major: number;
    minor: number;
    patch: number;
    preRelease?: string;
    build?: string;
}
export interface Release {
    version: SemVer;
    network: string;
    addresses: Addresses;
}
export declare function getVersion(): SemVer;
export declare function saveVersion(v: SemVer): void;
export declare function getLatestRelease(network: string): Release;
/** bump the version up one. Level may be "build", "major", "minor", or
 *  "patch" A build bump does not bump the major, minor, or patch
 *  version but replaces the preRelease and build strings
 */
export declare function bumpVersion(level: string, preRelease?: string, build?: string): void;
export declare function formatSemVer(v: SemVer): string;
export declare function writeReleaseInfo(release: Release, network: string): void;
//# sourceMappingURL=index.d.ts.map