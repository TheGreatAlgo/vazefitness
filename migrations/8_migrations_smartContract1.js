const Migrations = artifacts.require("heartRateConsumer1");
            module.exports = function (deployer) {
              deployer.deploy(Migrations);
            };
            