

// TODO: I'm not happy with the overal test case layout, but Truffle throws around
// weird errors if I do
//
// "let createTestInstance = () => Splitter.new(bob, carol);
//
// Pointers to better organize this and have proper invariants between unrelated test cases?

const Splitter = artifacts.require("Splitter");
const HasBeneficiariesTests = require('./hasBeneficiaries.js');
const truffleAssert = require('truffle-assertions');

contract("Splitter", accounts => {
  let alice = accounts[0];
  let bob = accounts[1];
  let carol = accounts[2];
  let other = accounts[3];

  let createTestInstance = () => Splitter.deployed();

  // Run all test cases that can be run on the base class alone
  //
  HasBeneficiariesTests.runTests(createTestInstance, alice, bob, carol, other);

  it("should be payable by Alice, but not split immediatly", async () => {
    const inst = await createTestInstance();

    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(inst.address));

    const payAmount = web3.utils.toBN(web3.utils.toWei('1', 'finney'));
    const tx = await inst.sendTransaction({ from: alice, value: payAmount });

    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceAfter.toString(), balanceBefore.add(payAmount).toString(), "Contract isn't payable by Alice");

    const totalReservedAmountAfter = web3.utils.toBN(await inst.getTotalReservedAmount());
    assert.equal(totalReservedAmountAfter.toString(), '0', "Contract splits immediatly");
  });
  it("should be payable by anyone", async () => {
    const inst = await createTestInstance();

    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(inst.address));

    const payAmount = web3.utils.toBN(web3.utils.toWei('2', 'finney'));
    const tx = await inst.sendTransaction({ from: other, value: payAmount });

    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceAfter.toString(), balanceBefore.add(payAmount).toString(), "Contract isn't payable by others");

    const totalReservedAmountAfter = web3.utils.toBN(await inst.getTotalReservedAmount());
    assert.equal(totalReservedAmountAfter.toString(), '0', "Contract splits immediatly");
  });

  it("should not allow Alice to withdraw()", async () => {
    const inst = await createTestInstance();

    await truffleAssert.reverts(inst.withdraw({ from: alice }));
  })
  it("should not allow other contracts to withdraw()", async () => {
    const inst = await createTestInstance();

    await truffleAssert.reverts(inst.withdraw({ from: other }));
  })
  it("shouldn't pay anything for withdraw() by Bob before split", async () => {
    const inst = await createTestInstance();

    const balanceBeforeSplitter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.isTrue(balanceBeforeSplitter.gt(new web3.utils.BN(1)), "Precond: Test case only makes sense if Splitter has balance > 1");

    const reservedBeforeBob = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    assert.equal(reservedBeforeBob.toString(), '0', "Precond: Test case only makes sense if Bob has no reserved amount");

    const tx = await inst.withdraw({ from: bob });

    // Check that the contract is in correct state
    //
    const balanceAfterSplitter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceBeforeSplitter.toString(), balanceAfterSplitter.toString(), "Balance of Splitter changed");

    const reservedAfterBob = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    assert.equal(reservedAfterBob.toString(), '0', "Reserved amount Bob is not 0");
  });
  it("shouldn't pay anything for withdraw() by Carol before split", async () => {
    const inst = await createTestInstance();

    const balanceBeforeSplitter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.isTrue(balanceBeforeSplitter.gt(new web3.utils.BN(1)), "Precond: Test case only makes sense if Splitter has balance > 1");

    const reservedBeforeCarol = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));
    assert.equal(reservedBeforeCarol.toString(), '0', "Precond: Test case only makes sense if Carol has no reserved amount");

    const tx = await inst.withdraw({ from: carol });

    // Check that the contract is in correct state
    //
    const balanceAfterSplitter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceBeforeSplitter.toString(), balanceAfterSplitter.toString(), "Balance of Splitter changed");

    const reservedAfterCarol = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));
    assert.equal(reservedAfterCarol.toString(), '0', "Reserved amount Carol is not 0");
  });

  it("should not allow splitAll() by Bob", async () => {
    const inst = await createTestInstance();
    await truffleAssert.reverts(inst.splitAll({ from: bob }));
  });
  it("should not allow splitAll() by Carol", async () => {
    const inst = await createTestInstance();
    await truffleAssert.reverts(inst.splitAll({ from: carol }));
  });
  it("should not allow splitAll() by other accounts", async () => {
    const inst = await createTestInstance();
    await truffleAssert.reverts(inst.splitAll({ from: other }));
  });
  it("should split everything for splitAll() by Alice with even amounts", async () => {
    const inst = await createTestInstance();

    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceBefore.isEven(), true, 'Precond: Balance should be even for this test case');

    const totalReservedAmountBefore = web3.utils.toBN(await inst.getTotalReservedAmount());
    assert.equal(totalReservedAmountBefore.toString(), '0', 'Precond: Reserved amount should be 0 for this test case');

    await inst.splitAll({ from: alice });

    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceAfter.toString(), balanceBefore.toString(), 'Balance changed during split');

    const totalReservedAmountAfter = web3.utils.toBN(await inst.getTotalReservedAmount());
    assert.equal(totalReservedAmountAfter.toString(), balanceBefore.toString(), 'Even balance not fully split');

    const reservedAliceAfter = web3.utils.toBN(await inst.getBeneficiaryAmount(alice));
    assert.equal(reservedAliceAfter.toString(), '0', "Alice shouldn't have a share");

    const reservedOtherAfter = web3.utils.toBN(await inst.getBeneficiaryAmount(other));
    assert.equal(reservedOtherAfter.toString(), '0', "Other accounts shouldn't have a share");

    const addedAmount = balanceBefore.div(web3.utils.toBN(2));

    const reservedBobAfter = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    assert.equal(reservedBobAfter.toString(), addedAmount.toString(), "Bob's share is wrong");

    const reservedCarolAfter = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));
    assert.equal(reservedCarolAfter.toString(), addedAmount.toString(), "Carol's share is wrong");
  });
  it("should split everything, and leave 1 for splitAll() by Alice with odd amounts", async () => {
    const inst = await createTestInstance();

    const payAmount = web3.utils.toBN(web3.utils.toWei('1', 'finney')).add(new web3.utils.BN(1));
    await inst.sendTransaction({ from: other, value: payAmount });

    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceBefore.isOdd(), true, 'Precond: Balance should be odd for this test case');

    await inst.splitAll({ from: alice });

    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceAfter.toString(), balanceBefore.toString(), 'Balance changed during split');

    const totalReservedAmountAfter = web3.utils.toBN(await inst.getTotalReservedAmount());
    assert.equal(totalReservedAmountAfter.toString(), balanceBefore.sub(web3.utils.toBN(1)).toString(), 'Even balance not fully split');

    const halfBalance = balanceBefore.div(web3.utils.toBN(2));

    const reservedBobAfter = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    assert.equal(reservedBobAfter.toString(), halfBalance.toString(), "Bob's share is wrong");

    const reservedCarolAfter = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));
    assert.equal(reservedCarolAfter.toString(), halfBalance.toString(), "Carol's share is wrong");

    assert.equal(reservedBobAfter.add(reservedCarolAfter).toString(), totalReservedAmountAfter.toString(), "Bob's and Carol's amount don't sum to totalReservedAmount");
  });

  it("should allow Bob to withdraw() correctly", async () => {
    const inst = await createTestInstance();

    const balanceBeforeSplitter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    const balanceBeforeBob = web3.utils.toBN(await web3.eth.getBalance(bob));

    const totalReservedAmountBefore = web3.utils.toBN(await inst.getTotalReservedAmount());
    const reservedBeforeBob = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    const reservedBeforeCarol = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));

    assert.isTrue(reservedBeforeBob.gt(0), "Precond: Test case only makes sense if Bob has reserved amount");

    const gasPrice =  web3.utils.toBN(await web3.eth.getGasPrice());
    const tx = await inst.withdraw({ from: bob, gasPrice: gasPrice });
    const txGas = web3.utils.toBN(tx.receipt.gasUsed).mul(gasPrice);

    // Check that the contract is in correct state
    //
    const balanceAfterSplitter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceBeforeSplitter.sub(reservedBeforeBob).toString(), balanceAfterSplitter.toString(), "Balance of Splitter wrong");

    const totalReservedAmountAfter = web3.utils.toBN(await inst.getTotalReservedAmount());
    assert.equal(totalReservedAmountBefore.sub(reservedBeforeBob).toString(), totalReservedAmountAfter.toString(), "Reserved amount of Splitter wrong");

    const reservedAfterBob = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    assert.equal(reservedAfterBob.toString(), '0', "Reserved amount Bob is not 0");

    const reservedAfterCarol = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));
    assert.equal(reservedAfterCarol.toString(), reservedBeforeCarol.toString(), "Reserved amount of Carol changed");

    // Check that Bob got his payout
    //
    const expectedBalanceAfterBob = balanceBeforeBob.add(reservedBeforeBob).sub(txGas);
    const balanceAfterBob = web3.utils.toBN(await web3.eth.getBalance(bob));
    assert.equal(balanceAfterBob.toString(), expectedBalanceAfterBob.toString(), "Balance of Bob wrong");
  })

  it("should split correctly on different reservedAmounts", async () => {
    const inst = await createTestInstance();

    const payAmount = web3.utils.toBN(web3.utils.toWei('1.5', 'finney'));
    await inst.sendTransaction({ from: other, value: payAmount });

    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    const totalReservedAmountBefore = web3.utils.toBN(await inst.getTotalReservedAmount());
    const reservedBeforeBob = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    const reservedBeforeCarol = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));

    assert.isFalse(reservedBeforeBob.eq(reservedBeforeCarol), 'Precond: Test case only makes sense, if reserved amounts differ')

    await inst.splitAll({ from: alice });

    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceAfter.toString(), balanceBefore.toString(), 'Balance changed during split');

    const addReservedAmount = balanceBefore.sub(totalReservedAmountBefore).div(web3.utils.toBN(2));

    const reservedBobAfter = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    assert.equal(reservedBobAfter.toString(), reservedBeforeBob.add(addReservedAmount).toString(), "Bob's share is wrong");

    const reservedCarolAfter = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));
    assert.equal(reservedCarolAfter.toString(), reservedBeforeCarol.add(addReservedAmount).toString(), "Carol's share is wrong");
  });

  it("should allow Carol to withdraw() correctly", async () => {
    const inst = await createTestInstance();

    const balanceBeforeSplitter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    const balanceBeforeCarol = web3.utils.toBN(await web3.eth.getBalance(carol));

    const totalReservedAmountBefore = web3.utils.toBN(await inst.getTotalReservedAmount());
    const reservedBeforeBob = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    const reservedBeforeCarol = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));

    assert.isTrue(reservedBeforeCarol.gt(0), "Precond: Test case only makes sense if Carol has reserved amount");

    const gasPrice =  web3.utils.toBN(await web3.eth.getGasPrice());
    const tx = await inst.withdraw({ from: carol, gasPrice: gasPrice });
    const txGas = web3.utils.toBN(tx.receipt.gasUsed).mul(gasPrice);

    // Check that the contract is in correct state
    //
    const balanceAfterSplitter = web3.utils.toBN(await web3.eth.getBalance(inst.address));
    assert.equal(balanceBeforeSplitter.sub(reservedBeforeCarol).toString(), balanceAfterSplitter.toString(), "Balance of Splitter wrong");

    const totalReservedAmountAfter = web3.utils.toBN(await inst.getTotalReservedAmount());
    assert.equal(totalReservedAmountBefore.sub(reservedBeforeCarol).toString(), totalReservedAmountAfter.toString(), "Reserved amount of Splitter wrong");

    const reservedAfterBob = web3.utils.toBN(await inst.getBeneficiaryAmount(bob));
    assert.equal(reservedAfterBob.toString(), reservedBeforeBob.toString(), "Reserved amount of Bob changed");

    const reservedAfterCarol = web3.utils.toBN(await inst.getBeneficiaryAmount(carol));
    assert.equal(reservedAfterCarol.toString(), '0', "Reserved amount Carol is not 0");

    // Check that Carol got her payout
    //
    const expectedBalanceAfterCarol = balanceBeforeCarol.add(reservedBeforeCarol).sub(txGas);
    const balanceAfterCarol = web3.utils.toBN(await web3.eth.getBalance(carol));
    assert.equal(balanceAfterCarol.toString(), expectedBalanceAfterCarol.toString(), "Balance of Carol wrong");
  })

});
