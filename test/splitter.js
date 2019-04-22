const Splitter = artifacts.require("Splitter");
const truffleAssert = require("truffle-assertions");
const BN = web3.utils.BN;

contract("Splitter", accounts => {
  const nullAddress = '0x0000000000000000000000000000000000000000'; // Is there no other way to get this?

  let alice = accounts[0];
  let bob   = accounts[1];
  let carol = accounts[2]; // Will have an initial splitter balance
  let dingo = accounts[3]; // Will have an initial splitter balance

  let inst;
  let initialPersonalBalanceBob;
  let initialPersonalBalanceCarol;
  let initialSplitterBalanceBob;
  let initialSplitterBalanceCarol;

  beforeEach(async () => {
    inst = await Splitter.new();

    const payAmount = web3.utils.toWei(new BN(2), "finney");
    await inst.splitFunds(carol, dingo, { from: alice, value: payAmount });

    initialPersonalBalanceBob   = web3.utils.toBN(await web3.eth.getBalance(bob));
    initialPersonalBalanceCarol = web3.utils.toBN(await web3.eth.getBalance(carol));
    initialSplitterBalanceBob   = new BN(0);
    initialSplitterBalanceCarol = web3.utils.toWei(new BN(1), "finney");
  });

  it("shouldn't be payable directly", async () => {
    const payAmount = web3.utils.toWei(new BN(1), "finney");
    await truffleAssert.reverts(inst.sendTransaction({ from: alice, value: payAmount }));
  });

  it("should properly return splitter balance on getBalance() of untouched account", async () => {
    splitterBalanceBob = web3.utils.toBN(await inst.getBalance(bob));
    assert.equal(splitterBalanceBob.toString(), '0', "Bob's splitter balance is wrong.");
  });

  it("should properly return splitter balance on getBalance() account with balance", async () => {
    splitterBalanceCarol = web3.utils.toBN(await inst.getBalance(carol));
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

    const splitterBalanceBob   = web3.utils.toBN(await inst.getBalance(bob));
    const splitterBalanceCarol = web3.utils.toBN(await inst.getBalance(carol));

    assert.equal(splitterBalanceBob  .toString(), initialSplitterBalanceBob.toString(), "Bob's splitter balance changed.");
    assert.equal(splitterBalanceCarol.toString(), initialSplitterBalanceCarol.toString(), "Carlos's splitter balance changed.");
  });

  it("should properly update splitter balances on splitFunds() with even amount transferred", async () => {
    const payAmount = web3.utils.toWei(new BN(2), "finney");
    await inst.splitFunds(bob, carol, { from: alice, value: payAmount });

    const splitterBalanceBob   = web3.utils.toBN(await inst.getBalance(bob));
    const splitterBalanceCarol = web3.utils.toBN(await inst.getBalance(carol));

    const splitterBalanceBobExpected   = initialSplitterBalanceBob  .add(payAmount.div(new BN(2)));
    const splitterBalanceCarolExpected = initialSplitterBalanceCarol.add(payAmount.div(new BN(2)));

    assert.equal(splitterBalanceBob  .toString(), splitterBalanceBobExpected.toString(), "Bob's splitter balance is wrong.");
    assert.equal(splitterBalanceCarol.toString(), splitterBalanceCarolExpected.toString(), "Carlos's splitter balance is wrong.");
  });

  it("should properly update splitter balances on splitFunds() with odd amount transferred", async () => {
    const payAmount = web3.utils.toWei(new BN(2), "finney").add(new BN(1));
    await inst.splitFunds(bob, carol, { from: alice, value: payAmount });

    const splitterBalanceBob   = web3.utils.toBN(await inst.getBalance(bob));
    const splitterBalanceCarol = web3.utils.toBN(await inst.getBalance(carol));

    const splitterBalanceBobExpected   = initialSplitterBalanceBob  .add(payAmount.div(new BN(2)).add(new BN(1)));
    const splitterBalanceCarolExpected = initialSplitterBalanceCarol.add(payAmount.div(new BN(2)));

    assert.equal(splitterBalanceBob  .toString(), splitterBalanceBobExpected.toString(), "Bob's splitter balance is wrong.");
    assert.equal(splitterBalanceCarol.toString(), splitterBalanceCarolExpected.toString(), "Carlos's splitter balance is wrong.");
  });

  it("shouldn't send money on splitFunds()", async () => {
    const payAmount = web3.utils.toWei(new BN(2), "finney");
    const tx = await inst.splitFunds(bob, carol, { from: alice, value: payAmount });

    const personalBalanceBob   = web3.utils.toBN(await web3.eth.getBalance(bob));
    const personalBalanceCarol = web3.utils.toBN(await web3.eth.getBalance(carol));

    assert.equal(personalBalanceBob  .toString(), initialPersonalBalanceBob.toString(), "Bob's personal balance changed.");
    assert.equal(personalBalanceCarol.toString(), initialPersonalBalanceCarol.toString(), "Carlos's personal balance changed.");
  });

  it("should emit LogSplitFunds() events on splitFunds()", async () => {
    const payAmount = web3.utils.toWei(new BN(2), "finney");
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

    const gasPrice =  web3.utils.toBN(await web3.eth.getGasPrice());
    const tx = await inst.withdraw({ from: carol, gasPrice: gasPrice });
    const txGas = web3.utils.toBN(tx.receipt.gasUsed).mul(gasPrice);

    const personalBalanceCarol = web3.utils.toBN(await web3.eth.getBalance(carol));
    const expectedPersonalBalanceCarol = initialPersonalBalanceCarol.add(initialSplitterBalanceCarol).sub(txGas);

    assert.equal(personalBalanceCarol.toString(), expectedPersonalBalanceCarol.toString(), "Carols's personal balance is wrong.");
  });

  it("should zero out splitter balance on withdraw()", async () => {
    assert.isTrue(initialSplitterBalanceCarol.gt(new BN(0)), "Precond: Test case only makes sense if Carols's splitter balance is non-zero.");

    await inst.withdraw({ from: carol });

    const splitterBalanceCarol = web3.utils.toBN(await inst.getBalance(carol));

    assert.equal(splitterBalanceCarol.toString(), "0", "Carols's splitter balance is non-zero.");
  });

  it("should emit LogWithdraw() event on withdraw()", async () => {
    let tx = await inst.withdraw({ from: carol });

    truffleAssert.eventEmitted(tx, "LogWithdraw", ev => {
      return ev.addr == carol && ev.newAmount == '0';
    });
  });

  // Ownable and Pausable have their own test cases in OpenZeppelin, we only test their
  // integration with our splitter, as well as changes we did to Pausable in here.
  //
  it("should make splitter creator the owner", async () => {
    let owner = await inst.owner();

    assert.equal(owner, alice, "Alice is not the owner!")
  });
  it("should not be paused at start", async () => {
    let isPaused = await inst.paused();

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

    const payAmount = web3.utils.toWei(new BN(2), "finney");
    await truffleAssert.reverts(inst.splitFunds(bob, carol, { from: alice, value: payAmount }));
  });
  it("should allow withdrawal for paused splitter", async () => {
    await inst.pause({ from: alice});
    await inst.withdraw({ from: carol });

    const splitterBalanceCarol = web3.utils.toBN(await inst.getBalance(carol));

    assert.equal(splitterBalanceCarol.toString(), "0", "Carols's splitter balance is non-zero.");
  });



});
