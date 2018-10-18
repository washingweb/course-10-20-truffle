pragma solidity ^0.4.24;

import "./Ownable.sol";

contract Saving is Ownable {
    
    struct Record {
        uint amount;
        uint time;
        address addr;
    }
    
    event BalanceChanged(uint amount, string action, uint time);
    event UserChanged(address addr, string action);
    
    mapping(address => bool) public validUsers;
    Record[] public records;
    
    uint constant LIMIT = 10 ether;
    
    modifier isValidUser() {
        require(validUsers[msg.sender], "not valid user");
        _;
    }
    
    constructor() public {
        owner = msg.sender;
    }
    
    function addUser(address _addr) external isOwner {
        validUsers[_addr] = true;
        emit UserChanged(_addr, "add");
    }
    
    function removeUser(address _addr) external isOwner {
        validUsers[_addr] = false;
        emit UserChanged(_addr, "remove");
    }
    
    function deposit() payable external {
        emit BalanceChanged(msg.value, "deposit", now);
    }
    
    function withdraw(uint amount) external isValidUser {
        if (howMuchWithdrawed() >= LIMIT) {
            revert("withdraw too much");
        }
        
        msg.sender.transfer(amount);
        
        Record memory record = Record({
            amount: amount,
            time: now,
            addr: msg.sender
        });
        
        records.push(record);
        
        emit BalanceChanged(amount, "withdraw", now);
    }
    
    function howMuchWithdrawed() public view returns(uint) {
        return _howMuchWithdrawed();
    }
    
    function _howMuchWithdrawed() private view returns(uint) {
        uint sum;
        for (uint i = 0; i < records.length; i++) {
            Record storage record = records[i];
            if (now - record.time < 1 days) {
                sum = sum + record.amount;
            }
        }
        return sum;
    }
}
