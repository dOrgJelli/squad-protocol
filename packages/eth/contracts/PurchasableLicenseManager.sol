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
        address squadNftAddress,
        address purchaseTokenAddress,
        address royaltiesAddress_
    ) LicenseManager(description_, squadNftAddress) {
        purchaseToken = ERC20(purchaseTokenAddress);
        royaltiesAddress = royaltiesAddress_;
    }

    event NFTRegistered(
        address nftAddress, 
        uint256 nftId, 
        address registrant,
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
        external
        onlyNFTOwner(nftAddress, nftId)
    {
        _registerNFT(
            nftAddress, 
            nftId, 
            msg.sender,
            price, 
            sharePercentage
        );
    }

    function _registerNFT(
        address nftAddress, 
        uint256 nftId, 
        address registrant,
        uint256 price, 
        uint8 sharePercentage
    ) 
        internal
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
            registrant,
            price,
            sharePercentage,
            address(licenseToken)
        );
    }

    
    // Using Squad NFT
    function createAndRegisterNFT(
        address creator,
        IERC721Squad.TokenData calldata data,
        uint256 price, 
        uint8 sharePercentage
    ) external {
        uint256 nftId = squadNft.mint(creator, data);
        _registerNFT(address(squadNft), nftId, creator, price, sharePercentage);
    }

    event NFTUnregistered(
      address nftAddress,
      uint256 nftId
    );

    function unregisterNFT(address nftAddress, uint256 nftId) 
        external
        nftRegistered(nftAddress, nftId)
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
    ) 
        external
        nftRegistered(nftAddress, nftId)
    {
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
    ) 
        external 
        view
        nftRegistered(nftAddress, nftId)
        returns(bool) 
    {
        LicenseParams memory licenseParams = registeredNFTs[nftAddress][nftId];
        return (licenseParams.licenseToken.balanceOf(holder) >= 1 ether);
    }

    modifier nftRegistered(address nftAddress, uint256 nftId) {
        LicenseParams memory licenseParams = registeredNFTs[nftAddress][nftId];
        require(address(licenseParams.licenseToken) != address(0), "NFT not registered.");
        _;
    }
}