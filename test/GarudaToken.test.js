const { expectRevert } = require("@openzeppelin/test-helpers");
const { assert } = require("chai");

const GarudaToken = artifacts.require('GarudaToken');

contract('GarudaToken', ([alice, bob, carol, operator, owner]) => {
    beforeEach(async () => {
        this.garuda = await GarudaToken.new({ from: owner });
        this.burnAddress = '0x000000000000000000000000000000000000dEaD';
        this.zeroAddress = '0x0000000000000000000000000000000000000000';
    });

    it('only operator', async () => {
        assert.equal((await this.garuda.owner()), owner);
        assert.equal((await this.garuda.operator()), owner);

        await expectRevert(this.garuda.updateTransferTaxRate(500, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.garuda.updateBurnRate(20, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.garuda.updateMaxTransferAmountRate(100, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.garuda.updateSwapAndLiquifyEnabled(true, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.garuda.setExcludedFromAntiWhale(operator, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.garuda.updateGarudaSwapRouter(operator, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.garuda.updateMinAmountToLiquify(100, { from: operator }), 'operator: caller is not the operator');
        await expectRevert(this.garuda.transferOperator(alice, { from: operator }), 'operator: caller is not the operator');
    });

    it('transfer operator', async () => {
        await expectRevert(this.garuda.transferOperator(operator, { from: operator }), 'operator: caller is not the operator');
        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        await expectRevert(this.garuda.transferOperator(this.zeroAddress, { from: operator }), 'GARUDA::transferOperator: new operator is the zero address');
    });

    it('update transfer tax rate', async () => {
        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        assert.equal((await this.garuda.transferTaxRate()).toString(), '500');
        assert.equal((await this.garuda.burnRate()).toString(), '20');

        await this.garuda.updateTransferTaxRate(0, { from: operator });
        assert.equal((await this.garuda.transferTaxRate()).toString(), '0');
        await this.garuda.updateTransferTaxRate(1000, { from: operator });
        assert.equal((await this.garuda.transferTaxRate()).toString(), '1000');
        await expectRevert(this.garuda.updateTransferTaxRate(1001, { from: operator }), 'GARUDA::updateTransferTaxRate: Transfer tax rate must not exceed the maximum rate.');

        await this.garuda.updateBurnRate(0, { from: operator });
        assert.equal((await this.garuda.burnRate()).toString(), '0');
        await this.garuda.updateBurnRate(100, { from: operator });
        assert.equal((await this.garuda.burnRate()).toString(), '100');
        await expectRevert(this.garuda.updateBurnRate(101, { from: operator }), 'GARUDA::updateBurnRate: Burn rate must not exceed the maximum rate.');
    });

    it('transfer', async () => {
        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        await this.garuda.mint(alice, 10000000, { from: owner }); // max transfer amount 25,000
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '0');

        await this.garuda.transfer(bob, 12345, { from: alice });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '9987655');
        assert.equal((await this.garuda.balanceOf(bob)).toString(), '11728');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '123');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '494');

        await this.garuda.approve(carol, 22345, { from: alice });
        await this.garuda.transferFrom(alice, carol, 22345, { from: carol });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '9965310');
        assert.equal((await this.garuda.balanceOf(carol)).toString(), '21228');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '346');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '1388');
    });

    it('transfer small amount', async () => {
        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        await this.garuda.mint(alice, 10000000, { from: owner });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '0');

        await this.garuda.transfer(bob, 19, { from: alice });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '9999981');
        assert.equal((await this.garuda.balanceOf(bob)).toString(), '19');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '0');
    });

    it('transfer without transfer tax', async () => {
        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        assert.equal((await this.garuda.transferTaxRate()).toString(), '500');
        assert.equal((await this.garuda.burnRate()).toString(), '20');

        await this.garuda.updateTransferTaxRate(0, { from: operator });
        assert.equal((await this.garuda.transferTaxRate()).toString(), '0');

        await this.garuda.mint(alice, 10000000, { from: owner });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '0');

        await this.garuda.transfer(bob, 10000, { from: alice });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '9990000');
        assert.equal((await this.garuda.balanceOf(bob)).toString(), '10000');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '0');
    });

    it('transfer without burn', async () => {
        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        assert.equal((await this.garuda.transferTaxRate()).toString(), '500');
        assert.equal((await this.garuda.burnRate()).toString(), '20');

        await this.garuda.updateBurnRate(0, { from: operator });
        assert.equal((await this.garuda.burnRate()).toString(), '0');

        await this.garuda.mint(alice, 10000000, { from: owner });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '0');

        await this.garuda.transfer(bob, 1234, { from: alice });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '9998766');
        assert.equal((await this.garuda.balanceOf(bob)).toString(), '1173');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '61');
    });

    it('transfer all burn', async () => {
        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        assert.equal((await this.garuda.transferTaxRate()).toString(), '500');
        assert.equal((await this.garuda.burnRate()).toString(), '20');

        await this.garuda.updateBurnRate(100, { from: operator });
        assert.equal((await this.garuda.burnRate()).toString(), '100');

        await this.garuda.mint(alice, 10000000, { from: owner });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '10000000');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '0');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '0');

        await this.garuda.transfer(bob, 1234, { from: alice });
        assert.equal((await this.garuda.balanceOf(alice)).toString(), '9998766');
        assert.equal((await this.garuda.balanceOf(bob)).toString(), '1173');
        assert.equal((await this.garuda.balanceOf(this.burnAddress)).toString(), '61');
        assert.equal((await this.garuda.balanceOf(this.garuda.address)).toString(), '0');
    });

    it('max transfer amount', async () => {
        assert.equal((await this.garuda.maxTransferAmountRate()).toString(), '50');
        assert.equal((await this.garuda.maxTransferAmount()).toString(), '0');

        await this.garuda.mint(alice, 1000000, { from: owner });
        assert.equal((await this.garuda.maxTransferAmount()).toString(), '5000');

        await this.garuda.mint(alice, 1000, { from: owner });
        assert.equal((await this.garuda.maxTransferAmount()).toString(), '5005');

        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        await this.garuda.updateMaxTransferAmountRate(100, { from: operator }); // 1%
        assert.equal((await this.garuda.maxTransferAmount()).toString(), '10010');
    });

    it('anti whale', async () => {
        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        assert.equal((await this.garuda.isExcludedFromAntiWhale(operator)), false);
        await this.garuda.setExcludedFromAntiWhale(operator, true, { from: operator });
        assert.equal((await this.garuda.isExcludedFromAntiWhale(operator)), true);

        await this.garuda.mint(alice, 10000, { from: owner });
        await this.garuda.mint(bob, 10000, { from: owner });
        await this.garuda.mint(carol, 10000, { from: owner });
        await this.garuda.mint(operator, 10000, { from: owner });
        await this.garuda.mint(owner, 10000, { from: owner });

        // total supply: 50,000, max transfer amount: 250
        assert.equal((await this.garuda.maxTransferAmount()).toString(), '250');
        await expectRevert(this.garuda.transfer(bob, 251, { from: alice }), 'GARUDA::antiWhale: Transfer amount exceeds the maxTransferAmount');
        await this.garuda.approve(carol, 251, { from: alice });
        await expectRevert(this.garuda.transferFrom(alice, carol, 251, { from: carol }), 'GARUDA::antiWhale: Transfer amount exceeds the maxTransferAmount');

        //
        await this.garuda.transfer(bob, 250, { from: alice });
        await this.garuda.transferFrom(alice, carol, 250, { from: carol });

        await this.garuda.transfer(this.burnAddress, 251, { from: alice });
        await this.garuda.transfer(operator, 251, { from: alice });
        await this.garuda.transfer(owner, 251, { from: alice });
        await this.garuda.transfer(this.garuda.address, 251, { from: alice });

        await this.garuda.transfer(alice, 251, { from: operator });
        await this.garuda.transfer(alice, 251, { from: owner });
        await this.garuda.transfer(owner, 251, { from: operator });
    });

    it('update SwapAndLiquifyEnabled', async () => {
        await expectRevert(this.garuda.updateSwapAndLiquifyEnabled(true, { from: operator }), 'operator: caller is not the operator');
        assert.equal((await this.garuda.swapAndLiquifyEnabled()), false);

        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        await this.garuda.updateSwapAndLiquifyEnabled(true, { from: operator });
        assert.equal((await this.garuda.swapAndLiquifyEnabled()), true);
    });

    it('update min amount to liquify', async () => {
        await expectRevert(this.garuda.updateMinAmountToLiquify(100, { from: operator }), 'operator: caller is not the operator');
        assert.equal((await this.garuda.minAmountToLiquify()).toString(), '500000000000000000000');

        await this.garuda.transferOperator(operator, { from: owner });
        assert.equal((await this.garuda.operator()), operator);

        await this.garuda.updateMinAmountToLiquify(100, { from: operator });
        assert.equal((await this.garuda.minAmountToLiquify()).toString(), '100');
    });
});
