// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "./LicenseManager.sol";

contract RevShareLicenseManager is LicenseManager {
    mapping(address => mapping(uint256 => uint8)) public registeredNFTs;

    string public constant NAME = "RevShareLicenseManager";

    constructor(string memory description_, address zoraAddress) 
        LicenseManager(description_, zoraAddress) {}

    event NFTRegistered(
        address nftAddress, 
        uint256 nftId, 
        address owner,
        uint8 minSharePercentage
    );

    function registerNFT(
        address nftAddress, 
        uint256 nftId, 
        uint8 minSharePercentage
    ) 
        public
        onlyNFTOwner(nftAddress, nftId)
    {
        require(minSharePercentage <= 100, "minSharePercentage greater than 100.");

        registeredNFTs[nftAddress][nftId] = minSharePercentage;

        emit NFTRegistered(
            nftAddress, 
            nftId, 
            msg.sender,
            minSharePercentage
        );
    }

    // Using Zora
    function createAndRegisterNFT(
        IMedia.MediaData calldata data, 
        IMarket.BidShares calldata bidShares,
        IMedia.EIP712Signature calldata sig,
        uint8 minSharePercentage
    ) external {
        uint256 nftsOwned = zoraMedia.balanceOf(msg.sender);
        zoraMedia.mintWithSig(msg.sender, data, bidShares, sig);
        uint256 nftId = zoraMedia.tokenOfOwnerByIndex(msg.sender, nftsOwned);

        registerNFT(address(zoraMedia), nftId, minSharePercentage);
    }

    event NFTUnregistered(
        address nftAddress, 
        uint256 nftId
    );

    function unregisterNFT(address nftAddress, uint256 nftId) 
        external 
        onlyNFTOwner(nftAddress, nftId) 
    {
        delete registeredNFTs[nftAddress][nftId];

        emit NFTUnregistered(
            nftAddress,
            nftId
        );
    }
}