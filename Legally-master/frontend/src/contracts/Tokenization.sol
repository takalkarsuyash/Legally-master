// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    uint256 public constant CLAIM_AMOUNT = 50 * 10**18; // 50 tokens (assuming 18 decimals)
    mapping(address => bool) public hasClaimed;

    constructor() ERC20("GameToken", "GTN") Ownable(msg.sender) {
        // optional: mint initial supply to owner for liquidity
        _mint(msg.sender, 1000 * 10**18);
    }

    /// @notice One-time claim function
    function claimTokens() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        hasClaimed[msg.sender] = true;
        _mint(msg.sender, CLAIM_AMOUNT); // mint directly to user
    }
}