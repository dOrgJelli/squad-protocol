// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ISquad.sol";
import "./IRightsManager.sol";

/**
 * Core contract for Squad, an open protocol for publishing and licensing intellectual property.
 */

// TODO when flattening the weights, the owner share for those licenses needs to be included, doesn't it?
    // Update: I think I fixed this

contract Squad is Ownable, ISquad {
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
    mapping(address => mapping(address => uint256)) public balances;
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

    /**
     * Construct the full weights for a license by adding in the integrated works' weights.
     * Note: this function currently doesn't compress weights, so a license can have two or 
     * more weights with the same address/id.
     */
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
                if (license.weights.length > 0) { // include the second order weights as well as the first order
                    // add first order weight
                    resultsAddresses[resultsLength] = weightsAddresses[i];
                    resultsIds[resultsLength] = weightsIds[i];
                    resultsWeights[resultsLength] = weights[i] * license.ownerShare / 10000;
                    resultsLength = resultsLength + 1;
                    for (uint256 j = 0; j < license.weights.length; j = j + 1) { // add second order weights
                        if (license.weights[j] * weights[i] / 10000 * license.ownerShare / 10000 != 0) {
                            resultsAddresses[resultsLength] = license.weightsAddresses[resultsLength];
                            resultsIds[resultsLength] = license.weightsIds[resultsLength];
                            resultsWeights[resultsLength] = license.weights[j] * weights[i] / 10000 * license.ownerShare / 10000;
                            resultsLength = resultsLength + 1;
                        }
                    }
                } else { // include just the first order weights
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

    Fully recursive version of fullWeights -- I believe this should not be needed

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

    function rightsParamsFor(
        address nftAddress, 
        uint256 nftId, 
        address rightsManager
    ) override external view returns (address, uint256) {
        License memory license = licenses[nftAddress][nftId];
        require(license.id != 0, "NFT does not have license");
        uint256 rightsIndex = 0;
        bool rightsExist = false;
        for (uint256 i = 0; i < license.rights.length; i = i + 1) {
            if (license.rightsAddresses[i] == rightsManager) {
                rightsExist = true;
                rightsIndex = i;
            }
        }
        require(rightsExist == true, "Rights do not exist");
        return (license.rights[rightsIndex].token, license.rights[rightsIndex].amount);
    }

    /**
     * Called by registered RightsManager contracts when they send the 
     * this contract assets. Looks up the NFT’s license and adjusts the 
     * accounting balances of the owner and other beneficiaries according to 
     * the owner's share and the weights. If the asset is not already listed 
     * in the accounting system, adds it.
     */

    function addPayment(address asset, uint256 amount, address nftAddress, uint256 nftId) override external onlyRightsManagers {
        License memory license = licenses[nftAddress][nftId];
        require(license.id != 0, "NFT does not have license");
        address nftOwner = ERC721(nftAddress).ownerOf(nftId);
        uint256 nftOwnerAmount = license.ownerShare / 10000 * amount;
        uint256 remainder = amount - nftOwnerAmount;
        if (tokenMapping[asset] == false) { 
            tokenMapping[asset] = true;
            tokenArray.push(asset);
        }
        for (uint256 i = 0; i < license.weights.length; i = i + 1) {
            address beneficiary = ERC721(license.weightsAddresses[i]).ownerOf(license.weightsIds[i]);
            uint256 beneficiaryAmount = (10000 - license.ownerShare) * license.weights[i] / 10000 * remainder;
            balances[asset][beneficiary] = balances[asset][beneficiary] + beneficiaryAmount;
            remainder = remainder - beneficiaryAmount;
        }
        balances[asset][nftOwner] = balances[asset][nftOwner] + nftOwnerAmount + remainder;
        emit PaymentAdded(asset, amount, nftAddress, nftId);
    }

    /**
     * Sends any of the asset held in its accounting system for the given address 
     * to that address, minus a fee. Can be called by anyone on behalf of any 
     * address.
     */
    event Withdrawal(
        address asset,
        bool Eth,
        address recipient,
        uint256 amount,
        address owner,
        uint256 ownerFee
    );

    function withdraw(address asset, address recipient) external {
        uint256 feeAmount = balances[asset][recipient] * fee / 10000;
        uint256 recipientAmount = balances[asset][recipient] - feeAmount;
        balances[asset][recipient] = balances[asset][recipient] - recipientAmount - feeAmount;
        require(ERC20(asset).transfer(recipient, recipientAmount), "Recipient ERC20 withdrawal failed.");
        require(ERC20(asset).transfer(owner(), feeAmount), "ERC20 withdrawal fee failed");
        emit Withdrawal(
            asset,
            false,
            recipient,
            recipientAmount,
            owner(),
            feeAmount
        );
    }

    /**
     * Add or remove a RightsManager contract from rightsManagers array.
     */
    event AddRightsManager(address rightsManager);
    
    function addRightsManager(address rightsManager) external onlyOwner {
        // TODO consider adding ERC165 to IRightsManager so we can confirm the interface here?
        require(rightsManager != address(0), "0 address submitted to addRightsManager");
        uint256 emptyIndex = 0;
        bool emptySlot = false;
        for (uint256 i = 0; i < rightsManagers.length; i = i + 1) {
            if (rightsManagers[i] == address(0)) {
                emptySlot = true;
                emptyIndex = i;
            }
        }
        if (emptySlot == true) {
            rightsManagers[emptyIndex] = rightsManager;
        } else {
            rightsManagers.push(rightsManager);
        }
        emit AddRightsManager(rightsManager);
    }

    event RemoveRightsManager(address[] rightsManagers, address removedRightsManager);

    function removeRightsManager(uint256 rightsManagerIndex) external onlyOwner {
        // TODO consider adding ERC165 to IRightsManager so we can confirm the interface here?
        require(rightsManagers[rightsManagerIndex] != address(0), "No rights manager at index");
        address removedRightsManager = address(rightsManagers[rightsManagerIndex]);
        delete rightsManagers[rightsManagerIndex];
        emit RemoveRightsManager(rightsManagers, removedRightsManager);
    }

    event SetFee(uint256 oldFee, uint256 newFee);

    function setFee(uint256 _fee) external onlyOwner {
        require(_fee <= 10000, "New fee greater than 10,000 basis points");
        uint256 oldFee = uint256(fee);
        fee = _fee;
        emit SetFee(oldFee, fee);
    }

    event ReceiveEther(uint256 amount);

    receive() external payable {
        emit ReceiveEther(msg.value);
    }

    fallback() external payable {
        emit ReceiveEther(msg.value);
    }

    /**
     * Modifiers
     */
    modifier onlyNFTOwner(address nftAddress, uint256 nftId) {
        require(msg.sender == ERC721(nftAddress).ownerOf(nftId), "Message sender does not own NFT");
        _;
    }

    modifier onlyRightsManagers {
        bool msgSenderFound = false;
        for (uint256 i = 0; i < rightsManagers.length; i = i + 1) {
            if (msg.sender == rightsManagers[i]) { msgSenderFound = true; }
        }
        require(msgSenderFound == true, "Message sender is not a registered rights manager contract");
        _;
    }
}