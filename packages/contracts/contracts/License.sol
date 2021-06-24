// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/* Interfaces needed to mint NFTs on Zora */

interface IMarket {
    struct D256 {
        uint256 value;
    }

    struct BidShares {
        // % of sale value that goes to the _previous_ owner of the nft
        D256 prevOwner;
        // % of sale value that goes to the original creator of the nft
        D256 creator;
        // % of sale value that goes to the seller (current owner) of the nft
        D256 owner;
    }
}

interface IMedia {
    struct EIP712Signature {
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct MediaData {
        string tokenURI;
        string metadataURI;
        bytes32 contentHash;
        bytes32 metadataHash;
    }

    /**
     * @notice EIP-712 mintWithSig method. Mints new media for a creator given a valid signature.
     */
    function mintWithSig(
        address creator,
        MediaData calldata data,
        IMarket.BidShares calldata bidShares,
        EIP712Signature calldata sig
    ) external;

    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns a token ID owned by `owner` at a given `index` of its token list.
     * Use along with {balanceOf} to enumerate all of ``owner``'s tokens.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
}

contract License {
    // string public fullTextURI;
    // string public fullTextHash;
    string public description;
    IMedia public zoraMedia;

    constructor(string memory description_, address zoraAddress) {
        description = description_;
        zoraMedia = IMedia(zoraAddress);
    }

    modifier onlyNFTOwner(address nftAddress, uint256 nftId) {
      require(ERC721(nftAddress).ownerOf(nftId) == msg.sender, "Message sender does not own NFT.");
      _;
    }
}