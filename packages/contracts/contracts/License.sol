// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract License {
    // string public fullTextURI;
    // string public fullTextHash;
    string public description;

    constructor(string memory description_) {
        description = description_;
    }

    modifier onlyNFTOwner(address nftAddress, uint256 nftId) {
      require(ERC721(nftAddress).ownerOf(nftId) == msg.sender, "Message sender does not own NFT");
      _;
    }
}