pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Saving.sol";

contract TestSaving {
    
    uint public initialBalance = 10 ether;

    function testOwner() public {
        Saving saving = Saving(DeployedAddresses.Saving());
        Assert.equal(saving.owner(), msg.sender, "An owner is different than deployer");
    }

    function testInitialBalanceShouldBeZero() public {
        Saving saving = Saving(DeployedAddresses.Saving());
        Assert.equal(address(saving).balance, 0, "balance should be zero");
    }

    function testShouldBeAbleToDeposit() public {
        Saving saving = Saving(DeployedAddresses.Saving());
        saving.deposit.value(1 ether)();
        Assert.equal(address(saving).balance, 1 ether, "balance should be 1 wei");
    }
}
