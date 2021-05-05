const GarudaReferral = artifacts.require("GarudaReferral");
const GarudaToken = artifacts.require("GarudaToken");
const Timelock = artifacts.require("Timelock");

module.exports = function(deployer) {
    deployer.deploy(GarudaReferral);
    deployer.deploy(GarudaToken);

    deployer.deploy(
        Timelock,
        "0x6d21333444FccEF0AceaB0bB9D7f25D5c2fa7AfD",
        28800
    );
};
