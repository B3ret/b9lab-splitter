const Splitter = artifacts.require("Splitter");

// TODO: There must be something wrong here, we hard-code the constructor
//       parameters. Do we need a factory contract to use migrations with
//       Truffle?
//
module.exports = function(deployer, network, accounts) {
  deployer.deploy(Splitter, accounts[1], accounts[2]);
};
