const HasBeneficiaries = artifacts.require("HasBeneficiaries");

// Test cases that can be performed purely on the abstract HasBeneficiaries base contract.
// Called from derived contracts to ensure proper inheritance.
// (And not in here, to avoid duplicating them).
//
const runTests = exports.runTests = (createTestInstance, alice, bob, carol, other) => {

  it('should set up Alice as owner at construction', async () => {
    const inst = await createTestInstance();
    const owner = await inst.owner();
    assert.equal(owner, alice, "alice isn't the owner of the deployed contract");
  });
  it("should set up Bob as beneficiary at construction", async () => {
    const inst = await createTestInstance();
    const ret = await inst._beneficiary0();
    assert.equal(ret[0], bob, "Bob isn't the first beneficiary of the deployed contract");
  });
  it("should set up Carol as beneficiary at construction", async () => {
    const inst = await createTestInstance();
    const ret = await inst._beneficiary1();
    assert.equal(ret[0], carol, "Carol isn't the second beneficiary of the deployed contract");
  });

  it("should return 0 for getBeneficiaryAmount() of Alice at start", async () => {
    const inst = await createTestInstance();
    const amount = await inst.getBeneficiaryAmount(alice);
    assert.equal(amount, 0, "initial getBeneficiaryAmount() for Alice is not 0");
  });
  it("should return 0 for getBeneficiaryAmount() of Bob at start", async () => {
    const inst = await createTestInstance();
    const amount = await inst.getBeneficiaryAmount(bob);
    assert.equal(amount, 0, "initial getBeneficiaryAmount() for Bob is not 0");
  });
  it("should return 0 for getBeneficiaryAmount() of Carol at start", async () => {
    const inst = await createTestInstance();
    const amount = await inst.getBeneficiaryAmount(carol);
    assert.equal(amount, 0, "initial getBeneficiaryAmount() for Carol is not 0");
  });
  it("should return 0 for getBeneficiaryAmount() of other accounts at start", async () => {
    const inst = await createTestInstance();
    const amount = await inst.getBeneficiaryAmount(other);
    assert.equal(amount, 0, "initial getBeneficiaryAmount() for other account is not 0");
  });

  it("should return 2 for getBeneficiaryCount()", async () => {
    const inst = await createTestInstance();
    const count = await inst.getBeneficiaryCount();
    assert.equal(count, 2, "Beneficiary count is not 2");
  });

  it("should return 0 for getTotalReservedAmount() at start", async () => {
    const inst = await createTestInstance();
    const amount = await inst.getTotalReservedAmount()
    assert.equal(amount, 0, "initial getTotalReservedAmount() is not 0");
  });

  it("should return false for isBeneficiary() of Alice", async () => {
    const inst = await createTestInstance();
    const isBene = await inst.isBeneficiary(alice)
    assert.equal(isBene, false, "Alise is a beneficiary, but shouldn't be");
  });
  it("should return true for isBeneficiary() of Bob", async () => {
    const inst = await createTestInstance();
    const isBene = await inst.isBeneficiary(bob)
    assert.equal(isBene, true, "Bob is not a beneficiary");
  });
  it("should return true for isBeneficiary() of Carol", async () => {
    const inst = await createTestInstance();
    const isBene = await inst.isBeneficiary(carol)
    assert.equal(isBene, true, "Carol is not a beneficiary");
  });
  it("should return false for isBeneficiary() of other accounts", async () => {
    const inst = await createTestInstance();
    const isBene = await inst.isBeneficiary(other)
    assert.equal(isBene, false, "Other account is a beneficiary, but shouldn't be");
  });
};


// We could run HasBeneficiaries separately, but then we'd have to add it to migrations.
//
// contract("HasBeneficiaries", accounts => {
//   let alice = accounts[0];
//   let bob = accounts[1];
//   let carol = accounts[2];
//   let other = accounts[3];

//   let createTestInstance = () => HasBeneficiaries.deployed();

//   runTests(createTestInstance, alice, bob, carol, other);
// });