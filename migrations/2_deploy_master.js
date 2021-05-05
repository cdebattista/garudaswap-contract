const MasterChef = artifacts.require("MasterChef");

module.exports = function(deployer) {
    deployer.deploy(
        MasterChef,
        //Garuda Token Address
        "0x854086dC841e1bfae50Cb615bF41f55BF432a90b",
        //StartBlock
        7241540,
        //Garuda Per Block
        "100000000000000000000"
    );
};
