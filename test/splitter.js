const Splitter = artifacts.require("Splitter");
const truffleAssert = require("truffle-assertions");
const { BN, toWei, toBN } = web3.utils;

contract("Splitter", accounts => {
  const nullAddress = '0x0000000000000000000000000000000000000000'; // Is there no other way to get this?

  const [alice, bob, carol] = accounts;

  let inst;
  let initialPersonalBalanceBob;
  let initialPersonalBalanceCarol;
  let initialSplitterBalanceAlice;
  let initialSplitterBalanceBob;
  let initialSplitterBalanceCarol;

  beforeEach(async () => {
    inst = await Splitter.new({ from: alice });

    const payAmount = toWei(new BN(2), "milli");
    await inst.splitFunds(alice, carol, { from: alice, value: payAmount });

    const halfAmount = toWei(new BN(1), "milli");
    initialPersonalBalanceBob   = toBN(await web3.eth.getBalance(bob));
    initialPersonalBalanceCarol = toBN(await web3.eth.getBalance(carol));
    initialSplitterBalanceAlice = halfAmount;
    initialSplitterBalanceBob   = new BN(0);
    initialSplitterBalanceCarol = halfAmount;
  });

  it("should revert on fallback function", async () => {
    await truffleAssert.reverts(inst.sendTransaction({ from: alice }));
  });

  it("should properly return splitter balance on getBalance() of untouched account", async () => {
    const splitterBalanceBob = toBN(await inst.getBalance(bob));
    assert.equal(splitterBalanceBob.toString(), '0', "Bob's splitter balance is wrong.");
  });

  it("should properly return splitter balance on getBalance() account with balance", async () => {
    const splitterBalanceCarol = toBN(await inst.getBalance(carol));
    assert.equal(splitterBalanceCarol.toString(), initialSplitterBalanceCarol.toString(), "Carols's splitter balance is wrong.");
  });

  it("should revert splitFunds() with first address 0x0", async () => {
    await truffleAssert.reverts(inst.splitFunds(nullAddress, carol, { from: alice, value: 0 }));
  });

  it("should revert splitFunds() with second address 0x0", async () => {
    await truffleAssert.reverts(inst.splitFunds(bob, nullAddress, { from: alice, value: 0 }));
  });

  it("shouldn't touch splitter balances on splitFunds() with nothing transferred", async () => {
    await inst.splitFunds(bob, carol, { from: alice, value: 0 });

    const splitterBalanceBob   = toBN(await inst.getBalance(bob));
    const splitterBalanceCarol = toBN(await inst.getBalance(carol));

    assert.equal(splitterBalanceBob  .toString(), initialSplitterBalanceBob.toString(), "Bob's splitter balance changed.");
    assert.equal(splitterBalanceCarol.toString(), initialSplitterBalanceCarol.toString(), "Carlos's splitter balance changed.");
  });

  it("should properly update splitter balances on splitFunds() with even amount transferred", async () => {
    const payAmount  = toWei(new BN(2), "milli");
    await inst.splitFunds(bob, carol, { from: alice, value: payAmount });

    const splitterBalanceAlice = toBN(await inst.getBalance(alice));
    const splitterBalanceBob   = toBN(await inst.getBalance(bob));
    const splitterBalanceCarol = toBN(await inst.getBalance(carol));

    const halfAmount = toWei(new BN(1), "milli");
    const splitterBalanceAliceExpected = initialSplitterBalanceAlice;
    const splitterBalanceBobExpected   = initialSplitterBalanceBob  .add(halfAmount);
    const splitterBalanceCarolExpected = initialSplitterBalanceCarol.add(halfAmount);

    assert.equal(splitterBalanceAlice.toString(), splitterBalanceAliceExpected.toString(), "Alice's splitter balance is wrong.");
    assert.equal(splitterBalanceBob  .toString(), splitterBalanceBobExpected.toString(), "Bob's splitter balance is wrong.");
    assert.equal(splitterBalanceCarol.toString(), splitterBalanceCarolExpected.toString(), "Carlos's splitter balance is wrong.");
  });

  it("should properly update splitter balances on splitFunds() with odd amount transferred", async () => {
    const payAmount = toWei(new BN(2), "milli").add(new BN(1));
    await inst.splitFunds(bob, carol, { from: alice, value: payAmount });

    const splitterBalanceAlice = toBN(await inst.getBalance(alice));
    const splitterBalanceBob   = toBN(await inst.getBalance(bob));
    const splitterBalanceCarol = toBN(await inst.getBalance(carol));

    const halfAmount = toWei(new BN(1), "milli");
    const splitterBalanceAliceExpected = initialSplitterBalanceAlice.add(new BN(1));
    const splitterBalanceBobExpected   = initialSplitterBalanceBob  .add(halfAmount);
    const splitterBalanceCarolExpected = initialSplitterBalanceCarol.add(halfAmount);

    assert.equal(splitterBalanceAlice.toString(), splitterBalanceAliceExpected.toString(), "Alice's splitter balance is wrong.");
    assert.equal(splitterBalanceBob  .toString(), splitterBalanceBobExpected.toString(), "Bob's splitter balance is wrong.");
    assert.equal(splitterBalanceCarol.toString(), splitterBalanceCarolExpected.toString(), "Carlos's splitter balance is wrong.");
  });

  it("should properly update splitter balances on splitFunds() with two matching addresses", async () => {
    const payAmount = toWei(new BN(2), "milli").add(new BN(1));
    await inst.splitFunds(bob, bob, { from: alice, value: payAmount });

    const splitterBalanceAlice = toBN(await inst.getBalance(alice));
    const splitterBalanceBob   = toBN(await inst.getBalance(bob));

    const fullEvenAmount = toWei(new BN(2), "milli");
    const splitterBalanceAliceExpected = initialSplitterBalanceAlice.add(new BN(1));
    const splitterBalanceBobExpected   = initialSplitterBalanceBob  .add(fullEvenAmount);

    assert.equal(splitterBalanceAlice.toString(), splitterBalanceAliceExpected.toString(), "Alice's splitter balance is wrong.");
    assert.equal(splitterBalanceBob  .toString(), splitterBalanceBobExpected.toString(), "Bob's splitter balance is wrong.");
  });

  it("should properly update splitter balances on splitFunds() with odd amount transferred, if owner is recipientOne", async () => {
    const payAmount = toWei(new BN(3), "milli").add(new BN(1));
    await inst.splitFunds(alice, bob, { from: alice, value: payAmount });

    const splitterBalanceAlice  = toBN(await inst.getBalance(alice));
    const splitterBalanceBob   = toBN(await inst.getBalance(bob));

    const halfAmount = toWei(new BN(1500), "micro");
    const splitterBalanceAliceExpected = initialSplitterBalanceAlice.add(halfAmount.add(new BN(1)));
    const splitterBalanceBobExpected   = initialSplitterBalanceBob  .add(halfAmount);

    assert.equal(splitterBalanceAlice.toString(), splitterBalanceAliceExpected.toString(), "Alice's splitter balance is wrong.");
    assert.equal(splitterBalanceBob  .toString(), splitterBalanceBobExpected.toString(), "Bob's splitter balance is wrong.");
  });

  it("should properly update splitter balances on splitFunds() with odd amount transferred, if owner is recipientTwo", async () => {
    const payAmount = toWei(new BN(1), "milli").add(new BN(1));
    await inst.splitFunds(bob, alice, { from: alice, value: payAmount });

    const splitterBalanceAlice = toBN(await inst.getBalance(alice));
    const splitterBalanceBob   = toBN(await inst.getBalance(bob));

    const halfAmount = toWei(new BN(500), "micro");
    const splitterBalanceAliceExpected = initialSplitterBalanceAlice.add(halfAmount.add(new BN(1)));
    const splitterBalanceBobExpected   = initialSplitterBalanceBob  .add(halfAmount);

    assert.equal(splitterBalanceAlice.toString(), splitterBalanceAliceExpected.toString(), "Alice's splitter balance is wrong.");
    assert.equal(splitterBalanceBob  .toString(), splitterBalanceBobExpected.toString(), "Bob's splitter balance is wrong.");
  });

  it("should properly update splitter balances on splitFunds() with owner being both recipiens", async () => {
    const payAmount = toWei(new BN(1), "milli").add(new BN(1));
    await inst.splitFunds(alice, alice, { from: alice, value: payAmount });

    const splitterBalanceAlice = toBN(await inst.getBalance(alice));

    const splitterBalanceAliceExpected = initialSplitterBalanceAlice.add(payAmount);

    assert.equal(splitterBalanceAlice.toString(), splitterBalanceAliceExpected.toString(), "Alice's splitter balance is wrong.");
  });

  it("shouldn't send money on splitFunds()", async () => {
    const payAmount = toWei(new BN(2), "milli");
    const tx = await inst.splitFunds(bob, carol, { from: alice, value: payAmount });

    const personalBalanceBob   = toBN(await web3.eth.getBalance(bob));
    const personalBalanceCarol = toBN(await web3.eth.getBalance(carol));

    assert.equal(personalBalanceBob  .toString(), initialPersonalBalanceBob.toString(), "Bob's personal balance changed.");
    assert.equal(personalBalanceCarol.toString(), initialPersonalBalanceCarol.toString(), "Carlos's personal balance changed.");
  });

  it("should emit LogSplitFunds() events on splitFunds()", async () => {
    const payAmount = toWei(new BN(2), "milli");
    const tx = await inst.splitFunds(bob, carol, { from: alice, value: payAmount });

    truffleAssert.eventEmitted(tx, "LogSplitFunds", ev => {
      return ev.sender == alice && ev.recipientOne == bob && ev.recipientTwo == carol && ev.paidAmount == payAmount.toString();
    });
  });

  it("should revert on withdraw() for zero balance", async () => {
    assert.isTrue(initialSplitterBalanceBob.eq(new BN(0)), "Precond: Test case only makes sense if bobs's splitter balance is zero.");

    await truffleAssert.reverts(inst.withdraw({ from: bob }));
  });

  it("should send full splitter balance on withdraw()", async () => {
    assert.isTrue(initialSplitterBalanceCarol.gt(new BN(0)), "Precond: Test case only makes sense if Carols's splitter balance is non-zero.");

    const gasPrice =  toBN(await web3.eth.getGasPrice());
    const tx = await inst.withdraw({ from: carol, gasPrice: gasPrice });
    const txGas = toBN(tx.receipt.gasUsed).mul(gasPrice);

    const personalBalanceCarol = toBN(await web3.eth.getBalance(carol));
    const expectedPersonalBalanceCarol = initialPersonalBalanceCarol.add(initialSplitterBalanceCarol).sub(txGas);

    assert.equal(personalBalanceCarol.toString(), expectedPersonalBalanceCarol.toString(), "Carols's personal balance is wrong.");
  });

  it("should zero out splitter balance on withdraw()", async () => {
    assert.isTrue(initialSplitterBalanceCarol.gt(new BN(0)), "Precond: Test case only makes sense if Carols's splitter balance is non-zero.");

    await inst.withdraw({ from: carol });

    const splitterBalanceCarol = toBN(await inst.getBalance(carol));

    assert.equal(splitterBalanceCarol.toString(), "0", "Carols's splitter balance is non-zero.");
  });

  it("should emit LogWithdraw() event on withdraw()", async () => {
    const tx = await inst.withdraw({ from: carol });

    truffleAssert.eventEmitted(tx, "LogWithdraw", ev => {
      return ev.addr == carol && ev.withdrawAmount == initialSplitterBalanceAlice.toString();
    });
  });

  // Ownable and Pausable have their own test cases in OpenZeppelin, we only test their
  // integration with our splitter, as well as changes we did to Pausable in here.
  //
  it("should make splitter creator the owner", async () => {
    const owner = await inst.owner();

    assert.equal(owner, alice, "Alice is not the owner!")
  });
  it("should not be paused at start", async () => {
    const isPaused = await inst.paused();

    assert.equal(isPaused, false, "Splitter is paused at start!")
  });
  it("should not allow non-owner to pause the splitter", async () => {
    await truffleAssert.reverts(inst.pause({ from: bob }));
  });
  it("should not allow non-owner to un-pause the splitter", async () => {
    await inst.pause({ from: alice});
    await truffleAssert.reverts(inst.unpause({ from: carol }));
  });
  it("should not allow splitting for paused splitter", async () => {
    await inst.pause({ from: alice});

    const payAmount = toWei(new BN(2), "milli");
    await truffleAssert.reverts(inst.splitFunds(bob, carol, { from: alice, value: payAmount }));
  });
  it("should allow withdrawal for paused splitter", async () => {
    await inst.pause({ from: alice});
    await inst.withdraw({ from: carol });

    const splitterBalanceCarol = toBN(await inst.getBalance(carol));

    assert.equal(splitterBalanceCarol.toString(), "0", "Carols's splitter balance is non-zero.");
  });

});