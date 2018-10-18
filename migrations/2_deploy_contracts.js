var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var Saving = artifacts.require('./Saving.sol');

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(Saving);
};
