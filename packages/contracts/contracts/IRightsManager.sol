// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

interface IRightsManager {

    /**
     * Function for registering an NFT to be able to sell the right associated 
     * with the contract. Should generally create a new ERC20 to track who owns the right. 
     */
    function registerNFT(address nftAddress, uint256 nftId) external returns (bool);

    // Check if a given address holds this contract's right.
    function check(address nftAddress, uint256 nftId, address toCheck) external returns (bool);

    /**
     * Contracts using this interface should generally also have 1) a viewable description of what type of usage 
     * rights the contract is meant to manage 2) a function to mint rights to a given address.
     */
}