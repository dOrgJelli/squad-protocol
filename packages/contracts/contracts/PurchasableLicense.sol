// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "./License.sol";
import "./ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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

    
    // Using Zora
    function createAndRegisterNFT(
        IMedia.MediaData calldata data, 
        IMarket.BidShares calldata bidShares,
        IMedia.EIP712Signature calldata sig,
        address zoraAddress,
        uint256 price, 
        uint256 sharePercentage
    ) external {
        IMedia zoraMedia = IMedia(zoraAddress);
        uint256 nftsOwned = zoraMedia.balanceOf(msg.sender);
        zoraMedia.mintWithSig(msg.sender, data, bidShares, sig);
        uint256 nftId = zoraMedia.tokenOfOwnerByIndex(msg.sender, nftsOwned + 1);

        registerNFT(zoraAddress, nftId, price, sharePercentage);
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