"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var merkle_tree_1 = require("./merkle-tree");
var ethers_1 = require("ethers");
var BalanceTree = /** @class */ (function () {
    function BalanceTree(balances) {
        this.tree = new merkle_tree_1.default(balances.map(function (_a, index) {
            var account = _a.account, allocation = _a.allocation;
            return BalanceTree.toNode(account, allocation);
        }));
    }
    BalanceTree.verifyProof = function (account, allocation, proof, root) {
        var pair = BalanceTree.toNode(account, allocation);
        for (var _i = 0, proof_1 = proof; _i < proof_1.length; _i++) {
            var item = proof_1[_i];
            pair = merkle_tree_1.default.combinedHash(pair, item);
        }
        return pair.equals(root);
    };
    BalanceTree.toNode = function (account, allocation) {
        return Buffer.from(ethers_1.utils
            .solidityKeccak256(["address", "uint256"], [account, allocation])
            .substr(2), "hex");
    };
    BalanceTree.prototype.getHexRoot = function () {
        return this.tree.getHexRoot();
    };
    // returns the hex bytes32 values of the proof
    BalanceTree.prototype.getProof = function (account, allocation) {
        return this.tree.getHexProof(BalanceTree.toNode(account, allocation));
    };
    return BalanceTree;
}());
exports.default = BalanceTree;
