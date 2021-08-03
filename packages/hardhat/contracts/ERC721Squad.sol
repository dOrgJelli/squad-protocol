// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721Squad is ERC721 {
    using Counters for Counters.Counter;


    //======== Structs ========

    struct TokenData {
        string contentURI;
        string metadataURI;
        bytes32 contentHash;
        bytes32 metadataHash;
    }


    //======== State ========

    Counters.Counter public tokenIdTracker;
    mapping(uint256 => string) public contentURIs;
    mapping(uint256 => string) public metadataURIs;
    mapping(uint256 => bytes32) public contentHashes;
    mapping(uint256 => bytes32) public metadataHashes;


    //======== Events ========

    event TokenMinted(
      uint256 tokenId,
      address creator,
      string contentURI,
      string metadataURI,
      bytes32 contentHash,
      bytes32 metadataHash
    );


    //======== Constructor ========

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}


    //======== External Functions ========

    function mint(
        address creator, 
        string calldata contentURI, 
        string calldata metadataURI,
        bytes32 contentHash,
        bytes32 metadataHash
    )
        external
        returns(uint256)
    {
        TokenData memory data = TokenData(
            contentURI, 
            metadataURI,
            contentHash,
            metadataHash
        );
        require(_validTokenData(data), "mint: invalid token data.");
        require(creator != address(0), "mint: creator is 0 address.");

        uint256 tokenId = tokenIdTracker.current();
        _safeMint(creator, tokenId);
        tokenIdTracker.increment();
        _setTokenData(
            tokenId, 
            data
        );

        emit TokenMinted(
            tokenId,
            creator,
            contentURIs[tokenId],
            metadataURIs[tokenId],
            contentHashes[tokenId],
            metadataHashes[tokenId]
        );

        return tokenId;
    }

    function nextTokenId() external view returns(uint256) {
      return tokenIdTracker.current();
    }


    //======== Internal Functions ========

    function _validTokenData(TokenData memory data) pure internal returns(bool) {
        require(bytes(data.contentURI).length != 0, "validTokenData: contentURI is missing.");
        require(bytes(data.metadataURI).length != 0, "validTokenData: metadataURI is missing.");
        require(data.contentHash != "", "validTokenData: metadataURI is missing.");
        require(data.metadataHash != "", "validTokenData: metadataURI is missing.");
        return true;
    }

    function _setTokenData(uint256 tokenId, TokenData memory data) internal {
        contentURIs[tokenId] = data.contentURI;
        metadataURIs[tokenId] = data.metadataURI;
        contentHashes[tokenId] = data.contentHash;
        metadataHashes[tokenId] = data.metadataHash;
    }
}
