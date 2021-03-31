// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * `ERC20Mintable` an ERC20 token that can be minted by the
 * owner
 */
contract ERC20Mintable is Ownable, ERC20 {
    constructor(string memory name, string memory symbol)
        public
        ERC20(name, symbol)
    {}

    /**
     * `mint`: Create `amount` new tokens for `account`
     */
    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }
}