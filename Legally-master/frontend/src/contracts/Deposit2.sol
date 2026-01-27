// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

contract Deposit {
    mapping(address => uint) private _balance;
    address payable public owner;
    uint256 public tokenPrice;
    uint256 public maxTokens = 20;
    event notification(address indexed accountHolder, string message);
    event TokenPurchased(
        address indexed buyer,
        uint256 tokens,
        uint256 ethPaid
    );

    mapping(address => uint256) private userTokens;
    mapping(address => uint256) private userPayments;

    constructor() {
        owner = payable(msg.sender);
        emit notification(msg.sender, "Contract Initialized");
    }

    function deposit() external payable returns (uint) {
        require(owner == msg.sender && _balance[msg.sender] < 1);
        _balance[msg.sender] += msg.value;
        emit notification(msg.sender, "Ether sent!!!!");
        return _balance[msg.sender];
    }

    function buy(uint256 tokenCount) external payable {
        require(tokenCount > 0, "Token count must be > 0");

        uint256 requiredAmount = tokenCount * tokenPrice;
        require(msg.value == requiredAmount, "Incorrect ETH sent");
        require(
            userTokens[msg.sender] + tokenCount <= maxTokens,
            "Token exhausted"
        );
        userTokens[msg.sender] += tokenCount;
        userPayments[msg.sender] += msg.value;
        emit TokenPurchased(msg.sender, tokenCount, msg.value);
    }

    function getBalanceContact() public view returns (uint) {
        return owner.balance;
    }
}
