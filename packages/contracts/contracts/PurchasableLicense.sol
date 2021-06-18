// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "./License.sol";
import "./ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// To allow creating and registering in one call with Zora:
import "./utils/IMedia.sol";
import "./utils/IMarket.sol";

contract PurchasableLicense is License {
    struct LicenseParams {
        uint256 price;
        uint256 requiredSharePercentage;
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
        uint256 requiredSharePercentage,
        address licenseTokenAddress
    );

    function registerNFT(
        address nftAddress, 
        uint256 nftId, 
        uint256 price, 
        uint256 requiredSharePercentage
    ) 
        public 
        onlyNFTOwner(nftAddress, nftId)
    {
        ERC721 nft = ERC721(nftAddress);
        string memory name = string(abi.encodePacked(NAME, nft.name(), nftId));
        string memory symbol = string(abi.encodePacked("l", nft.symbol(), nftId));
        ERC20Mintable licenseToken = new ERC20Mintable(name, symbol);
        
        registeredNFTs[nftAddress][nftId] = LicenseParams(
            price,
            requiredSharePercentage,
            licenseToken
        );
        
        emit NFTRegistered(
            nftAddress,
            nftId,
            price,
            requiredSharePercentage,
            address(licenseToken)
        );
    }

    // Using Zora
    function createAndRegisterNFT(
        IMedia.MediaData calldata data, 
        IMarket.BidShares calldata bidShares,
        address zoraAddress,
        uint256 nftId, 
        uint256 price, 
        uint256 requiredSharePercentage
    ) external {
      // how do we get the new token ID from this??
        IMedia(zoraAddress).mint(data, bidShares);
    }

    event NFTUnregistered(
      address nftAddress,
      uint256 nftId
    );

    function unregisterNFT(address nftAddress, uint256 nftId) 
        external 
        onlyNFTOwner(nftAddress, nftId) 
    {
        registeredNFTs[nftAddress][nftId] = registeredNFTs[address(0)][0];

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
        require(
            purchaseToken.allowance(purchaser, address(this)) >= purchasePrice,
            "Invalid allowance"
        );

        purchaseToken.transferFrom(purchaser, royaltiesAddress, purchasePrice);
        licenseParams.licenseToken.mint(purchaser, numberToBuy);

        emit Purchase(
            nftAddress,
            nftId,
            purchaser,
            numberToBuy,
            address(licenseParams.licenseToken)
        );
    }
}