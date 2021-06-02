// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// for testing only

contract ERC721Mintable is ERC721 {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }
}