export declare type Contract = {
    address: string;
    abiPath: string;
};
export declare type ContractInfo = {
    [index: string]: Contract;
};
export declare type SquadProtocolConfig = {
    network: string;
    networkNameOrUrl: string;
    contracts: ContractInfo;
};
export declare type SquadProtocolSecrets = {
    deployPrivateKey: string;
};
export declare function getConfig(): any;
export declare function writeConfig(config: SquadProtocolConfig, id?: string): void;
export declare function getSecrets(): any;
//# sourceMappingURL=index.d.ts.map