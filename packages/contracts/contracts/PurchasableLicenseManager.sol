// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "./LicenseManager.sol";
import "./ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PurchasableLicenseManager is LicenseManager {
    struct LicenseParams {
        uint256 price;
        uint8 sharePercentage;
        ERC20Mintable licenseToken;
    }

    mapping(address => mapping(uint256 => LicenseParams)) public registeredNFTs;
    ERC20 public purchaseToken;
    address public royaltiesAddress;

    string public constant NAME = "PurchasableLicenseManager";

    constructor(
        string memory description_, 
        address zoraAddress,
        address purchaseTokenAddress,
        address royaltiesAddress_
    ) LicenseManager(description_, zoraAddress) {
        purchaseToken = ERC20(purchaseTokenAddress);
        royaltiesAddress = royaltiesAddress_;
    }

    event NFTRegistered(
        address nftAddress, 
        uint256 nftId, 
        address owner,
        uint256 price, 
        uint8 sharePercentage,
        address licenseTokenAddress
    );

    function registerNFT(
        address nftAddress, 
        uint256 nftId, 
        uint256 price, 
        uint8 sharePercentage
    ) 
        public 
        onlyNFTOwner(nftAddress, nftId)
    {
        require(sharePercentage <= 100, "sharePercentage greater than 100.");

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
            msg.sender,
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
        uint256 price, 
        uint8 sharePercentage
    ) external {
        uint256 nftsOwned = zoraMedia.balanceOf(msg.sender);
        zoraMedia.mintWithSig(msg.sender, data, bidShares, sig);
        uint256 nftId = zoraMedia.tokenOfOwnerByIndex(msg.sender, nftsOwned);

        registerNFT(address(zoraMedia), nftId, price, sharePercentage);
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
        uint256 price,
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

        require(purchaseToken.transferFrom(purchaser, royaltiesAddress, purchasePrice), "Transfer failed.");
        licenseParams.licenseToken.mint(purchaser, numberToBuy * 1 ether);

        emit Purchase(
            nftAddress,
            nftId,
            purchaser,
            numberToBuy,
            purchasePrice,
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