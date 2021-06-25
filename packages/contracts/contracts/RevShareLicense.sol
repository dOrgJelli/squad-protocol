// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "./License.sol";

contract RevShareLicense is License {
    mapping(address => mapping(uint256 => uint256)) public registeredNFTs;

    string public constant NAME = "RevShareLicense";

    constructor(string memory description_, address zoraAddress) 
        License(description_, zoraAddress) {}

    event NFTRegistered(
        address nftAddress, 
        uint256 nftId, 
        uint256 requiredSharePercentage
    );

    function registerNFT(
        address nftAddress, 
        uint256 nftId, 
        uint256 requiredSharePercentage
    ) 
        public
        onlyNFTOwner(nftAddress, nftId)
    {
        require(requiredSharePercentage <= 100, "sharePercentage greater than 100.");

        registeredNFTs[nftAddress][nftId] = requiredSharePercentage;

        emit NFTRegistered(
            nftAddress, 
            nftId, 
            requiredSharePercentage
        );
    }

    // Using Zora
    function createAndRegisterNFT(
        IMedia.MediaData calldata data, 
        IMarket.BidShares calldata bidShares,
        IMedia.EIP712Signature calldata sig,
        uint256 requiredSharePercentage
    ) external {
        uint256 nftsOwned = zoraMedia.balanceOf(msg.sender);
        zoraMedia.mintWithSig(msg.sender, data, bidShares, sig);
        uint256 nftId = zoraMedia.tokenOfOwnerByIndex(msg.sender, nftsOwned + 1);

        registerNFT(address(zoraMedia), nftId, requiredSharePercentage);
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