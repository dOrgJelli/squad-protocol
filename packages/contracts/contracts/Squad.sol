// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./IRightsManager.sol";

/**
 * Core contract for Squad, an open protocol for publishing and licensing intellectual property.
 */

// New problem: when flattening the weights, the owner share for those licenses needs to be included, doesn't it?

contract Squad is Ownable {
    /**
     * Standard inputs RightsManager contracts may take in the sale 
     * or other distribution of usage rights.
     */ 
    struct RightsParams {
        address token; // 0 address here indicates to use ETH
        uint256 amount;
        // TODO add generically useful data space here
    }

    struct License {
        uint256 id;
        uint256 ownerShare;
        address[] weightsAddresses;
        uint256[] weightsIds;
        uint256[] weights;
        address[] rightsAddresses;
        RightsParams[] rights;
        // TODO description
    }

    /**
     * Usage rights state
     */
    address[] public rightsManagers;
    mapping(address => mapping(uint256 => License)) public licenses;
    uint256 licenseCount;

    /**
     * Accounting state
     */ 
    address[] public tokenArray; // erc20 array
    mapping(address => bool) public tokenMapping; // erc20 mapping
    mapping(address => mapping(address => uint256)) public tokenBalances;
    mapping(address => uint256) public ethBalances;
    uint256 public fee;

    constructor(address[] memory _rightsManagers, uint256 _fee) {
        require(_fee <= 10000, "Fee greater than 10,000 basis points");
        rightsManagers = _rightsManagers;
        fee = _fee;
    }

    /**
     * Add or edit a license in the licenses mapping.
     * Also registers the NFT in the selected RightsManager contracts.
     */
    event NFTRegistered(License license);

    function registerNFT(
        address nftAddress,
        uint256 nftId,
        uint256 ownerShare,
        address[] memory weightsAddresses,
        uint256[] memory weightsIds,
        uint256[] memory weights,
        address[] memory rightsAddresses,
        address[] memory rightsTokens,
        uint256[] memory rightsAmounts
    ) external onlyNFTOwner(nftAddress, nftId) {
        require(ownerShare <= 10000, "Owner's share greater than 10,000 basis points");
        License storage license = licenses[nftAddress][nftId];
        license.ownerShare = ownerShare;
        (license.weightsAddresses, license.weightsIds, license.weights) = fullWeights(weightsAddresses, weightsIds, weights);
        registerRights(
            nftAddress,
            nftId,
            rightsAddresses,
            rightsTokens,
            rightsAmounts
        );
        licenseCount = licenseCount + 1;
        license.id = licenseCount;
        emit NFTRegistered(license);
    }

    function registerRights(
        address nftAddress,
        uint256 nftId,
        address[] memory rightsAddresses,
        address[] memory rightsTokens,
        uint256[] memory rightsAmounts
    ) internal {
        License storage license = licenses[nftAddress][nftId];
        for (uint256 i = 0; i < rightsAddresses.length; i = i + 1) {
            IRightsManager rightsManager = IRightsManager(license.rightsAddresses[i]);
            if (rightsManager.registerNFT(nftAddress, nftId) == true) {
                license.rightsAddresses[i] = rightsAddresses[i];
                RightsParams memory rightsParams = RightsParams(
                    rightsTokens[i],
                    rightsAmounts[i]
                );
                license.rights[i] = rightsParams;
            }
        }
    }

    // Construct the full weights for a license by traversing the license graph.
    function fullWeights(
        address[] memory weightsAddresses,
        uint256[] memory weightsIds,
        uint256[] memory weights
    ) view internal returns (address[] memory, uint256[] memory, uint256[] memory) {
        uint256 resultsLength = 0;
        address[] memory resultsAddresses;
        uint256[] memory resultsIds;
        uint256[] memory resultsWeights;
        for (uint256 i = 0; i < weights.length; i = i + 1) {
            License memory license = licenses[weightsAddresses[i]][weightsIds[i]];
            if (license.id != 0) {
                if (license.weights.length > 0) {
                    for(uint256 j = 0; j < license.weights.length; j = j + 1) {
                        if(license.weights[j] * weights[i] / 10000 != 0) {
                            resultsAddresses[resultsLength] = license.weightsAddresses[resultsLength];
                            resultsIds[resultsLength] = license.weightsIds[resultsLength];
                            resultsWeights[resultsLength] = license.weights[j] * weights[i] / 10000;
                            resultsLength = resultsLength + 1;
                        }
                    }
                } else {
                    resultsAddresses[resultsLength] = weightsAddresses[i];
                    resultsIds[resultsLength] = weightsIds[i];
                    resultsWeights[resultsLength] = weights[i];
                    resultsLength = resultsLength + 1;
                }
            }
        }
        return (resultsAddresses, resultsIds, resultsWeights);
    }

    /*

    Fully recursive version of fullWeights

    function fullWeights(
        address[] memory weightsAddresses,
        uint256[] memory weightsIds,
        uint256[] memory weights
    ) internal returns (address[] memory, uint256[] memory, uint256[] memory) {
        uint256 resultsLength = 0;
        address[] memory resultsAddresses;
        uint256[] memory resultsIds;
        uint256[] memory resultsWeights;
        for (uint256 i = 0; i < weights.length; i = i + 1) {
            License memory license = licenses[weightsAddresses[i]][weightsIds[i]];
            if (license.id != 0) {
                if (license.weights.length > 0) {
                    (
                        address[] memory subweightsAddresses, 
                        uint256[] memory subweightsIds,
                        uint256[] memory subweights
                    ) = fullWeights(
                        license.weightsAddresses,
                        license.weightsIds,
                        license.weights
                    );
                    for(uint256 j = 0; j < subweights.length; j = j + 1) {
                        if(subweights[j] * weights[i] / 10000 != 0) {
                            resultsAddresses[resultsLength] = subweightsAddresses[resultsLength];
                            resultsIds[resultsLength] = subweightsIds[resultsLength];
                            resultsWeights[resultsLength] = subweights[j] * weights[i] / 10000;
                            resultsLength = resultsLength + 1;
                        }
                    }
                } else {
                    resultsAddresses[resultsLength] = weightsAddresses[i];
                    resultsIds[resultsLength] = weightsIds[i];
                    resultsWeights[resultsLength] = weights[i];
                    resultsLength = resultsLength + 1;
                }
            }
        }
        return (resultsAddresses, resultsIds, resultsWeights);
    }

    */

    /**
     * Called by registered RightsManager contracts when they send the 
     * this contract assets. Looks up the NFT’s license and adjust the 
     * accounting balances according to the owner's share and the weights. 
     * If the asset is not already listed in the accounting system, adds it.
     */
    event PaymentAdded(
        address asset,
        uint256 amount,
        address nftAdress,
        uint256 nftId
    );

    function addPayment(address asset, uint256 amount, address nftAddress, uint256 nftId) public onlyRightsManagers {
        License memory license = licenses[nftAddress][nftId];
        require(license.id != 0, "NFT does not have license");
        address owner = ERC721(nftAddress).ownerOf(nftId);
        uint256 ownerAmount = license.ownerShare / 10000 * amount;
        uint256 remainder = amount - ownerAmount;
        if (asset == address(0)) { // assume asset is Eth
            for (uint256 i = 0; i < license.weights.length; i = i + 1) {
                address beneficiary = ERC721(license.weightsAddresses[i]).ownerOf(license.weightsIds[i]);
                uint256 beneficiaryAmount = (10000 - license.ownerShare) * license.weights[i] / 10000 * remainder;
                ethBalances[beneficiary] = ethBalances[beneficiary] + beneficiaryAmount;
                remainder = remainder - beneficiaryAmount;
            }
            ethBalances[owner] = ethBalances[owner] + ownerAmount + remainder;
        } else { // assume asset is an ERC20
            if (tokenMapping[asset] == false) { 
                tokenMapping[asset] = true;
                tokenArray.push(asset);
            }
            for (uint256 i = 0; i < license.weights.length; i = i + 1) {
                address beneficiary = ERC721(license.weightsAddresses[i]).ownerOf(license.weightsIds[i]);
                uint256 beneficiaryAmount = (10000 - license.ownerShare) * license.weights[i] / 10000 * remainder;
                tokenBalances[asset][beneficiary] = tokenBalances[asset][beneficiary] + beneficiaryAmount;
                remainder = remainder - beneficiaryAmount;
            }
            tokenBalances[asset][owner] = tokenBalances[asset][owner] + ownerAmount + remainder;
        }
        emit PaymentAdded(asset, amount, nftAddress, nftId);
    }

    /**
     * Sends any of the asset held in its accounting system for the given address 
     * to that address, minus a fee. Can be called by anyone on behalf of any 
     * address. Calculates the fee to deal only in whole numbers in order to 
     * avoid creating dust.
     */
    event Withdrawal();

    function withdraw() external {

    }

    /**
     * Adds or removes a RightsManager contract from rightsManagers array.
     */
    event AddRemoveRightsManager();
    
    function addRemoveRightsManager() external onlyOwner {

    }

    event SetFee();

    function setFee() external onlyOwner {

    }

    /**
     * Modifiers
     */
    modifier onlyNFTOwner(address nftAddress, uint256 nftId) {
        // TODO require that the address fits ERC721
        // TODO require that the message sender is the NFT's owner
        _;
    }

    modifier onlyRightsManagers {
        _;
    }

}