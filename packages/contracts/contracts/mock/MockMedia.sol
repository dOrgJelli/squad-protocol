// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

// This contract mocks up a part of Zora's Media contract for testing purposes only.

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
}

contract MockMedia is IMedia, ERC721Enumerable {
    uint256 public count;

    // Mapping from address to mint with sig nonce
    mapping(address => uint256) public mintWithSigNonces;

    //keccak256("MintWithSig(bytes32 contentHash,bytes32 metadataHash,uint256 creatorShare,uint256 nonce,uint256 deadline)");
    bytes32 public constant MINT_WITH_SIG_TYPEHASH =
        0x2952e482b8e2b192305f87374d7af45dc2eafafe4f50d26a0c02e90f2fdbe14b;

    constructor() ERC721("Mock Media", "MMA") {}

    /**
     * @notice see IMedia
     */
    function mint(MediaData memory data, IMarket.BidShares memory bidShares)
        public
    {
        _mintForCreator(msg.sender, data, bidShares);
    }

    /**
     * @notice see IMedia
     */
    function mintWithSig(
        address creator,
        MediaData memory data,
        IMarket.BidShares memory bidShares,
        EIP712Signature memory sig
    ) public {
        require(
            sig.deadline == 0 || sig.deadline >= block.timestamp,
            "Media: mintWithSig expired"
        );

        bytes32 domainSeparator = _calculateDomainSeparator();

        bytes32 digest =
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    domainSeparator,
                    keccak256(
                        abi.encode(
                            MINT_WITH_SIG_TYPEHASH,
                            data.contentHash,
                            data.metadataHash,
                            bidShares.creator.value,
                            mintWithSigNonces[creator]++,
                            sig.deadline
                        )
                    )
                )
            );

        address recoveredAddress = ecrecover(digest, sig.v, sig.r, sig.s);

        require(
            recoveredAddress != address(0) && creator == recoveredAddress,
            "Media: Signature invalid"
        );

        _mintForCreator(recoveredAddress, data, bidShares);
    }

    function _mintForCreator(
        address creator, 
        MediaData memory data, 
        IMarket.BidShares memory bidShares
    ) internal {
        uint256 id = count;
        bytes32 trash = keccak256(abi.encode(data, bidShares));
        _safeMint(creator, id);
        count += 1;
    }

    /**
     * @dev Calculates EIP712 DOMAIN_SEPARATOR based on the current contract and chain ID.
     */
    function _calculateDomainSeparator() internal view returns (bytes32) {
        uint256 chainID;
        /* solium-disable-next-line */
        assembly {
            chainID := chainid()
        }

        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256(bytes("Zora")),
                    keccak256(bytes("1")),
                    chainID,
                    address(this)
                )
            );
    }
}