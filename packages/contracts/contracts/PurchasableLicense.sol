// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "./License.sol";
import "./ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
    struct MediaData {
        // A valid URI of the content represented by this token
        string tokenURI;
        // A valid URI of the metadata associated with this token
        string metadataURI;
        // A SHA256 hash of the content pointed to by tokenURI
        bytes32 contentHash;
        // A SHA256 hash of the content pointed to by metadataURI
        bytes32 metadataHash;
    }

    function mint(MediaData calldata data, IMarket.BidShares calldata bidShares) external;
}

contract PurchasableLicense is License {
    struct LicenseParams {
        uint256 price;
        uint256 sharePercentage;
        ERC20Mintable licenseToken;
    }

    mapping(address => mapping(uint256 => LicenseParams)) public registeredNFTs;
    ERC20 public purchaseToken;
    address public royaltiesAddress;

    string public constant NAME = "PurchasableLicense";

    constructor(
        string memory description_, 
        address purchaseTokenAddress,
        address royaltiesAddress_
    ) License(description_) {
        purchaseToken = ERC20(purchaseTokenAddress);
        royaltiesAddress = royaltiesAddress_;
    }

    event NFTRegistered(
        address nftAddress, 
        uint256 nftId, 
        uint256 price, 
        uint256 sharePercentage,
        address licenseTokenAddress
    );

    function registerNFT(
        address nftAddress, 
        uint256 nftId, 
        uint256 price, 
        uint256 sharePercentage
    ) 
        public 
        onlyNFTOwner(nftAddress, nftId)
    {
        require(
            0 <= sharePercentage && sharePercentage <= 100, 
            "sharePercentage less than 0 or greater than 100."
        );

        ERC721 nft = ERC721(nftAddress);
        string memory name = string(abi.encodePacked(NAME, nft.name(), nftId));
        string memory symbol = string(abi.encodePacked("l", nft.symbol(), nftId));
        ERC20Mintable licenseToken = new ERC20Mintable(name, symbol);
        
        registeredNFTs[nftAddress][nftId] = LicenseParams(
            price,
            sharePercentage,
            licenseToken
        );
        
        emit NFTRegistered(
            nftAddress,
            nftId,
            price,
            sharePercentage,
            address(licenseToken)
        );
    }

    /*
    // Using Zora
    function createAndRegisterNFT(
        IMedia.MediaData calldata data, 
        IMarket.BidShares calldata bidShares,
        address zoraAddress,
        uint256 nftId, 
        uint256 price, 
        uint256 sharePercentage
    ) external {
      // how do we get the new token ID from this??
        IMedia(zoraAddress).mint(data, bidShares);
    }
    */

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

    event Purchase(
        address nftAddress, 
        uint256 nftId, 
        address purchaser, 
        uint256 licensesBought,
        address licenseTokenAddress
    );

    function purchase(
        address nftAddress, 
        uint256 nftId, 
        address purchaser, 
        uint256 numberToBuy
    ) external {
        LicenseParams memory licenseParams = registeredNFTs[nftAddress][nftId];
        uint256 purchasePrice = licenseParams.price * numberToBuy;

        require(purchaseToken.transferFrom(purchaser, royaltiesAddress, purchasePrice), "Transfer failed: was the allowance set correctly?");
        licenseParams.licenseToken.mint(purchaser, numberToBuy);

        emit Purchase(
            nftAddress,
            nftId,
            purchaser,
            numberToBuy,
            address(licenseParams.licenseToken)
        );
    }

    function holdsLicense(
        address nftAddress, 
        uint256 nftId, 
        address holder
    ) external view returns(bool) {
        return (registeredNFTs[nftAddress][nftId].licenseToken.balanceOf(holder) >= 1 ether);
    }
}