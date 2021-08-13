"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecrets = exports.writeConfig = exports.getConfig = void 0;
const fs = require("fs");
const path = require("path");
const os_1 = require("os");
const latestConfigPath = path.resolve(path.join("..", "squad-config.json"));
function getConfig() {
    return JSON.parse(fs.readFileSync(latestConfigPath).toString());
}
exports.getConfig = getConfig;
function writeConfig(config, id = "default") {
    if (id == "default") {
        id = Date.now().toString();
    }
    const configFilename = `${config.network}-${id}.json`;
    const configPath = path.resolve(path.join("..", "config", configFilename));
    const data = JSON.stringify(config);
    fs.writeFileSync(configPath, data);
    fs.writeFileSync(latestConfigPath, data);
}
exports.writeConfig = writeConfig;
function getSecrets() {
    const config = getConfig();
    const secretsDir = process.env.SQUAD_SECRETS_DIR || path.join(os_1.homedir(), ".squad/");
    const secretsPath = path.join(secretsDir, `${config.network}-secrets.json`);
    if (!fs.existsSync(secretsPath)) {
        throw new Error(`Could not find secrets at ${secretsPath}`);
    }
    try {
        const secrets = JSON.parse(fs.readFileSync(secretsPath).toString());
        return secrets;
    }
    catch (e) {
        throw new Error(`Could not parse secrets at ${secretsPath}\n\n${e}`);
    }
}
exports.getSecrets = getSecrets;
//# sourceMappingURL=index.js.map