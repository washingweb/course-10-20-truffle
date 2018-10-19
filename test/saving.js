/* 
 *   https://truffleframework.com/docs/truffle/testing/writing-tests-in-javascript
 *   https://truffleframework.com/docs/truffle/getting-started/interacting-with-your-contracts
 */

const Saving = artifacts.require("./Saving.sol");

contract("Saving", function(accounts) {
  it("should pass", function() {});

  it("sets an owner", async () => {
    const saving = await Saving.deployed();
    assert.equal(await saving.owner.call(), accounts[0]);
  });

  it("should have zero balance when deployed", async function() {
    const instance = await Saving.deployed();
    const address = await instance.address;
    const balance = await web3.eth.getBalance(address);
    assert.equal(balance, 0, "initial balance should be 0");
  });

  it("should be able to deposit", async function() {
    const instance = await Saving.deployed();
    const address = await instance.address;
    const result = await instance.deposit({ from: accounts[0], value: 100 });
    assert.equal(result.logs.length, 1, "event not filed");
    const log = result.logs[0];
    assert.equal(
      log.event,
      "BalanceChanged",
      "event type is not BalanceChanged"
    );
    assert.equal(log.args.amount.toNumber(), 100, "event amount is not 100");
    assert.equal(log.args.action, "deposit", "event action is not deposit");
    const balance = await web3.eth.getBalance(address);
    assert.equal(balance, 100, "balance should be 100 after deposit");
  });

  it("should reject withdraw if user is not valid", async function() {
    const instance = await Saving.deployed();
    try {
      await instance.withdraw(100, { from: accounts[1] });
      throw "withdraw should be rejected";
    } catch (error) {
      assert.equal(
        error.message,
        "VM Exception while processing transaction: revert not valid user",
        "withdraw should be rejected with correct message"
      );
    }
  });

  it("should could add user", async function() {
    const instance = await Saving.deployed();
    await instance.addUser(accounts[1], { from: accounts[0] });
    // const valid = instance.validUsers.call(accounts[1]);
    // assert.equal(valid, true, "user should be valid");
  });
});
