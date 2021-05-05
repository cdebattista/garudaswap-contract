const { expectRevert } = require('@openzeppelin/test-helpers');
const { assert } = require("chai");

const GarudaReferral = artifacts.require('GarudaReferral');

contract('GarudaReferral', ([alice, bob, carol, referrer, operator, owner]) => {
    beforeEach(async () => {
        this.garudaReferral = await GarudaReferral.new({ from: owner });
        this.zeroAddress = '0x0000000000000000000000000000000000000000';
    });

    it('should allow operator and only owner to update operator', async () => {
        assert.equal((await this.garudaReferral.operators(operator)).valueOf(), false);
        await expectRevert(this.garudaReferral.recordReferral(alice, referrer, { from: operator }), 'Operator: caller is not the operator');

        await expectRevert(this.garudaReferral.updateOperator(operator, true, { from: carol }), 'Ownable: caller is not the owner');
        await this.garudaReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.garudaReferral.operators(operator)).valueOf(), true);

        await this.garudaReferral.updateOperator(operator, false, { from: owner });
        assert.equal((await this.garudaReferral.operators(operator)).valueOf(), false);
        await expectRevert(this.garudaReferral.recordReferral(alice, referrer, { from: operator }), 'Operator: caller is not the operator');
    });

    it('record referral', async () => {
        assert.equal((await this.garudaReferral.operators(operator)).valueOf(), false);
        await this.garudaReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.garudaReferral.operators(operator)).valueOf(), true);

        await this.garudaReferral.recordReferral(this.zeroAddress, referrer, { from: operator });
        await this.garudaReferral.recordReferral(alice, this.zeroAddress, { from: operator });
        await this.garudaReferral.recordReferral(this.zeroAddress, this.zeroAddress, { from: operator });
        await this.garudaReferral.recordReferral(alice, alice, { from: operator });
        assert.equal((await this.garudaReferral.getReferrer(alice)).valueOf(), this.zeroAddress);
        assert.equal((await this.garudaReferral.referralsCount(referrer)).valueOf(), '0');

        await this.garudaReferral.recordReferral(alice, referrer, { from: operator });
        assert.equal((await this.garudaReferral.getReferrer(alice)).valueOf(), referrer);
        assert.equal((await this.garudaReferral.referralsCount(referrer)).valueOf(), '1');

        assert.equal((await this.garudaReferral.referralsCount(bob)).valueOf(), '0');
        await this.garudaReferral.recordReferral(alice, bob, { from: operator });
        assert.equal((await this.garudaReferral.referralsCount(bob)).valueOf(), '0');
        assert.equal((await this.garudaReferral.getReferrer(alice)).valueOf(), referrer);

        await this.garudaReferral.recordReferral(carol, referrer, { from: operator });
        assert.equal((await this.garudaReferral.getReferrer(carol)).valueOf(), referrer);
        assert.equal((await this.garudaReferral.referralsCount(referrer)).valueOf(), '2');
    });

    it('record referral commission', async () => {
        assert.equal((await this.garudaReferral.totalReferralCommissions(referrer)).valueOf(), '0');

        await expectRevert(this.garudaReferral.recordReferralCommission(referrer, 1, { from: operator }), 'Operator: caller is not the operator');
        await this.garudaReferral.updateOperator(operator, true, { from: owner });
        assert.equal((await this.garudaReferral.operators(operator)).valueOf(), true);

        await this.garudaReferral.recordReferralCommission(referrer, 1, { from: operator });
        assert.equal((await this.garudaReferral.totalReferralCommissions(referrer)).valueOf(), '1');

        await this.garudaReferral.recordReferralCommission(referrer, 0, { from: operator });
        assert.equal((await this.garudaReferral.totalReferralCommissions(referrer)).valueOf(), '1');

        await this.garudaReferral.recordReferralCommission(referrer, 111, { from: operator });
        assert.equal((await this.garudaReferral.totalReferralCommissions(referrer)).valueOf(), '112');

        await this.garudaReferral.recordReferralCommission(this.zeroAddress, 100, { from: operator });
        assert.equal((await this.garudaReferral.totalReferralCommissions(this.zeroAddress)).valueOf(), '0');
    });
});
