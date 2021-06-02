// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

interface ISquad {
    /**
     * Standard inputs RightsManager contracts may take in the sale 
     * or other distribution of usage rights.
     */ 
    struct RightsParams {
        address token;
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

    function getLicense(address nftAddress, uint256 nftId) external view returns (License memory);

    function rightsParamsFor(
        address nftAddress, 
        uint256 nftId, 
        address rightsManager
    ) external view returns (address, uint256);

    event PaymentAdded(
        address asset,
        uint256 amount,
        address nftAdress,
        uint256 nftId
    );

    function addPayment(address asset, uint256 amount, address nftAddress, uint256 nftId) external;
}