// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "./LicenseManager.sol";

contract RevShareLicenseManager is LicenseManager {
    mapping(address => mapping(uint256 => uint8)) public minSharePercentages;
    mapping(address => mapping(uint256 => bool)) public registeredNFTs;

    string public constant NAME = "RevShareLicenseManager";

    constructor(string memory description_, address squadNftAddress) 
        LicenseManager(description_, squadNftAddress) {}

    event NFTRegistered(
        address nftAddress, 
        uint256 nftId, 
        address registrant,
        uint8 minSharePercentage
    );

    function registerNFT(
        address nftAddress, 
        uint256 nftId, 
        uint8 minSharePercentage
    )
        external
        onlyNFTOwner(nftAddress, nftId)
    {
        _registerNFT(
            nftAddress,
            nftId,
            msg.sender,
            minSharePercentage
        );
    }

    function _registerNFT(
        address nftAddress, 
        uint256 nftId, 
        address registrant,
        uint8 minSharePercentage
    ) 
        internal
    {
        require(minSharePercentage <= 100, "minSharePercentage greater than 100.");

        minSharePercentages[nftAddress][nftId] = minSharePercentage;
        registeredNFTs[nftAddress][nftId] = true;

        emit NFTRegistered(
            nftAddress, 
            nftId, 
            registrant,
            minSharePercentage
        );
    }

    // Using Squad NFT
    function createAndRegisterNFT(
        address creator,
        IERC721Squad.TokenData calldata data,
        uint8 minSharePercentage
    ) external {
        uint256 nftId = squadNft.mint(creator, data);
        _registerNFT(address(squadNft), nftId, creator, minSharePercentage);
    }

    event NFTUnregistered(
        address nftAddress, 
        uint256 nftId
    );

    function unregisterNFT(address nftAddress, uint256 nftId) 
        external
        nftRegistered(nftAddress, nftId)
        onlyNFTOwner(nftAddress, nftId) 
    {
        require(registeredNFTs[nftAddress][nftId] == true, "NFT not registered.");

        delete minSharePercentages[nftAddress][nftId];
        registeredNFTs[nftAddress][nftId] = false;

        emit NFTUnregistered(
            nftAddress,
            nftId
        );
    }

    modifier nftRegistered(address nftAddress, uint256 nftId) {
      require(registeredNFTs[nftAddress][nftId] == true, "NFT not registered.");
      _;
    }
}