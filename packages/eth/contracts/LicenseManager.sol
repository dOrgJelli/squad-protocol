// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface IERC721Squad {
    struct TokenData {
        // A valid URI of the content represented by this token
        string contentURI;
        // A valid URI of the metadata associated with this token
        string metadataURI;
    }

    function mint(
      address creator,
      TokenData memory data
    ) external returns(uint256);
}

contract LicenseManager {
    // string public fullTextURI;
    // string public fullTextHash;
    string public description;
    IERC721Squad public squadNft;

    constructor(string memory description_, address squadNftAddress) {
        description = description_;
        squadNft = IERC721Squad(squadNftAddress);
    }

    modifier onlyNFTOwner(address nftAddress, uint256 nftId) {
      require(ERC721(nftAddress).ownerOf(nftId) == msg.sender, "Message sender does not own NFT.");
      _;
    }
}