const Splitter = artifacts.require("Splitter");

// TODO: There must be something wrong here, we hard-code the constructor
//       parameters. Do we need a factory contract to use migrations with
//       Truffle?
//
module.exports = function(deployer) {
  deployer.deploy(Splitter);
};
