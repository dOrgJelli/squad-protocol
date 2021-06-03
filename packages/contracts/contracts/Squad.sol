// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ISquad.sol";
import "./IRightsManager.sol";

import "hardhat/console.sol";

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
     * Rev share weights are calculated off-chain and only submitted here.
     */
    event NFTRegistered(License license);

    function registerNFT(
        address nftAddress,
        uint256 nftId,
        uint256 ownerShare,
        address[] memory weightsAddresses,
        uint256[] memory weightsIds,
        uint256[] memory weights,
        address rightsAddress,
        address rightsToken,
        uint256 rightsAmount
    ) external onlyNFTOwner(nftAddress, nftId) {
        require(ownerShare <= 10000, "Owner's share greater than 10,000 basis points");
        require(sumArray(weights) <= 10000, "Weights sum to more than 10,000 basis points");
        License storage license = licenses[nftAddress][nftId];
        (
            license.ownerShare,
            license.weightsAddresses, 
            license.weightsIds, 
            license.weights
        ) = (ownerShare, weightsAddresses, weightsIds, weights);
        IRightsManager rightsManager = IRightsManager(rightsAddress);
        if (rightsManager.registerNFT(nftAddress, nftId) == true) {
            license.rightsAddresses.push(rightsAddress);
            RightsParams memory rightsParams = RightsParams(
                rightsToken,
                rightsAmount
            );
            license.rights.push(rightsParams);
        }
        licenseCount = licenseCount + 1;
        license.id = licenseCount;
        emit NFTRegistered(license);
    }

    function getLicense(address nftAddress, uint256 nftId) override external view returns (License memory) {
        License memory license = licenses[nftAddress][nftId];
        return license;
    }

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
     * this contract tokens. Looks up the NFT’s license and adjusts the 
     * accounting balances of the owner and other beneficiaries according to 
     * the owner's share and the weights. If the token is not already listed 
     * in the accounting system, adds it.
     */

    // Is there a reason for this to be restricted to rights managers?

    function addPayment(address token, uint256 amount, address nftAddress, uint256 nftId) override external {
        License memory license = licenses[nftAddress][nftId];
        require(license.id != 0, "NFT does not have license");
        address nftOwner = ERC721(nftAddress).ownerOf(nftId);
        uint256 nftOwnerAmount = license.ownerShare * amount / 10000;
        uint256 beneficiariesAmount = amount - nftOwnerAmount;
        uint256 remainder = beneficiariesAmount;
        if (tokenMapping[token] == false) { 
            tokenMapping[token] = true;
            tokenArray.push(token);
        }
        for (uint256 i = 0; i < license.weights.length; i = i + 1) {
            address beneficiary = ERC721(license.weightsAddresses[i]).ownerOf(license.weightsIds[i]);
            uint256 beneficiaryAmount = license.weights[i] * beneficiariesAmount / 10000;
            balances[token][beneficiary] = balances[token][beneficiary] + beneficiaryAmount;
            remainder = remainder - beneficiaryAmount;
        }
        balances[token][nftOwner] = balances[token][nftOwner] + nftOwnerAmount + remainder;
        emit PaymentAdded(token, amount, nftAddress, nftId);
    }

    function tokens() external view returns (address[] memory) {
        return tokenArray;
    }

    function balance(address token, address recipient) external view returns (uint256) {
        require(tokenMapping[token] == true, "Token is not registered");
        return balances[token][recipient];
    }

    /**
     * Sends any of the token held in its accounting system for the given address 
     * to that address, minus a fee. Can be called by anyone on behalf of any 
     * address.
     */
    event Withdrawal(
        address token,
        address recipient,
        uint256 amount,
        address squadOwner,
        uint256 squadFee
    );

    function withdraw(address token, address recipient) external {
        uint256 feeAmount = balances[token][recipient] * fee / 10000;
        uint256 recipientAmount = balances[token][recipient] - feeAmount;
        balances[token][recipient] = balances[token][recipient] - recipientAmount - feeAmount;
        require(ERC20(token).transfer(recipient, recipientAmount), "Recipient ERC20 withdrawal failed.");
        require(ERC20(token).transfer(owner(), feeAmount), "ERC20 withdrawal fee failed");
        emit Withdrawal(
            token,
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

    function getRightsManagers() external view returns (address[] memory) {
        return rightsManagers;
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

    function sumArray(uint256[] memory array) internal pure returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < array.length; i += 1) {
            sum += array[i];
        }
        return sum;
    }
/*
    // TODO: contract currently shouldn't be able to receive ether
    event ReceiveEther(uint256 amount);

    receive() external payable {
        emit ReceiveEther(msg.value);
    }

    fallback() external payable {
        emit ReceiveEther(msg.value);
    }
*/
    /**
     * Modifiers
     */
    modifier onlyNFTOwner(address nftAddress, uint256 nftId) {
        require(msg.sender == ERC721(nftAddress).ownerOf(nftId), "Message sender does not own NFT");
        _;
    }

/*
    modifier onlyRightsManagers {
        bool msgSenderFound = false;
        for (uint256 i = 0; i < rightsManagers.length; i = i + 1) {
            if (msg.sender == rightsManagers[i]) { msgSenderFound = true; }
        }
        require(msgSenderFound == true, "Message sender is not a registered rights manager contract");
        _;
    }
    */
}