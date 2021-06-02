// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./IRightsManager.sol";
import "./ISquad.sol";
import "./ERC20Mintable.sol";

contract SquadRights is Ownable, IRightsManager {
    /**
     * TODO viewable, qualatative (legalese?) description of the usage rights 
     * this contract manages
     */

    /**
     * Mapping of NFTs (address + id) to tokens used to represent usage rights.
     */
    mapping(address => mapping(uint256 => ERC20Mintable)) public rightsTokens;

    function registerNFT(address nftAddress, uint256 nftId) external override onlyOwner returns (bool) {
        ERC721 nft = ERC721(nftAddress);
        string memory name = string(abi.encodePacked("SquadRights", nft.name(), nftId));
        string memory symbol = string(abi.encodePacked("r", nft.symbol(), nftId));
        rightsTokens[nftAddress][nftId] = new ERC20Mintable(name, symbol);
        return true;
    }

    function price(address nftAddress, uint256 nftId) public view returns (address, uint256) {
        ISquad squad = ISquad(owner());
        (address tokenAddress, uint256 amount) = squad.rightsParamsFor(nftAddress, nftId, address(this));
        return (tokenAddress, amount);
    }

    function buy(address nftAddress, uint256 nftId) external payable {
        ISquad squad = ISquad(owner());
        ERC20Mintable rightsToken = rightsTokens[nftAddress][nftId];
        (address tokenAddress, uint256 amount) = squad.rightsParamsFor(nftAddress, nftId, address(this));
        ERC20 token = ERC20(tokenAddress);
        token.transferFrom(msg.sender, owner(), amount);
        squad.addPayment(tokenAddress, amount, nftAddress, nftId);
        rightsToken.mint(msg.sender, 1 ether);
    }

    function check(address nftAddress, uint256 nftId, address toCheck) external override view returns (bool) {
        ERC20Mintable rightsToken = ERC20Mintable(rightsTokens[nftAddress][nftId]);
        bool result = (rightsToken.balanceOf(toCheck) >= 1 ether);
        return result;
    }

    function rightsTokenBalance(address nftAddress, uint256 nftId, address toCheck) external view returns (uint256) {
        ERC20Mintable rightsToken = ERC20Mintable(rightsTokens[nftAddress][nftId]);
        return rightsToken.balanceOf(toCheck);
    }

}