// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

contract Deposit {
    mapping(address => uint) private _balance;
    address payable public owner;
    event notification(address indexed accountHolder, string message);

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

    function getBalanceContact() public view returns (uint) {
        return owner.balance;
    }
}
