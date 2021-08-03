// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Mintable is Ownable, ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }
}