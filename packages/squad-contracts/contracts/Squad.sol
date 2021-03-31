// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * 
 */

contract Squad is Ownable {
    /**
     * Standard inputs RightsManager contracts may take in the sale 
     * or other distribution of usage rights.
     */ 
    struct RightsParams {
        bool eth;
        address token;
        uint256 amount;
        // TODO add generically useful data space here
    }

    struct License {
        uint256 id;
        mapping(address => uint256) weights;
        mapping(address => RightsParams) rights;
        // TODO description
    }

    /**
     * Usage rights state
     */
    address[] public rightsManagers;
    mapping(address => License) public licenses;
    uint256 licenseCount;

    /**
     * Accounting state
     */
    address[] public tokens; // erc20s
    mapping(address => mapping(address => uint256)) public tokenBalances;
    mapping(address => uint256) public ethBalances;
    uint256 public fee;

    constructor(address[] _rightsManagers, uint256 _fee) public {
        rightsManagers = _rightsManagers; // TODO Use ERC165 to confirm these interfaces
        fee = _fee;
    }

    event NFTRegistered();

    /**
     * Add or edit a license in the licenses mapping. 
     * Also registers the NFT in the selected RightsManager contracts.
     */
    function registerNFT(
        address nftAddress,
        address[] weightAddresses,
        uint256[] weights,
        address[] rightsAddresses,
        bool[] rightsEths,
        address[] rightsTokens,
        uint256[] rightsAmounts
    ) external onlyNFTOwner(nftAddress) {
        License storage license = licenses[nftAddress];
        license.id = licenseCount + 1;
        for (uint256 i = 0; i < weightAddresses.length; i = i + 1) {
            // TODO iterate through the tree using recursion
            // for each address in weights, load its license if it has one
            // if it does have one
            // this could also be done off-chain if its expensive, which it seems like it will be...
        }
        for (uint256 i = 0; i < rightsAddresses.length; i = i + 1) {

        }
        licenseCount = licenseCount + 1;
    }

    event PaymentAdded();

    /**
     * Called by registered RightsManager contracts when they send the 
     * this contract assets. Looks up the NFT’s license and adjust the 
     * accounting balances according to the owner's share and the weights. 
     * If the asset is not already listed in the accounting system, adds it.
     */
    function addPayment() public onlyRightsManagers {

    }

    event Withdrawal();

    /**
     * Sends any of the asset held in its accounting system for the given address 
     * to that address, minus a fee. Can be called by anyone on behalf of any 
     * address. Calculates the fee to deal only in whole numbers in order to 
     * avoid creating dust.
     */
    function withdraw() external {

    }

    event AddRemoveRightsManager();

    /**
     * Adds or removes a RightsManager contract from rightsManagers array.
     */
    function addRemoveRightsManager() external onlyOwner {

    }

    event SetFee();

    function setFee() external onlyOwner {

    }

    /**
     * Modifiers
     */
    modifier onlyNFTOwner(address nftAddress) {
        // TODO require that the address fits ERC721
        // TODO require that the message sender is the NFT's owner
        _;
    }

    modifier onlyRightsManagers {
        _;
    }

}