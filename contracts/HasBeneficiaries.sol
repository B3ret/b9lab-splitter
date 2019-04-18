// TODO: Fix a version before release
//
pragma solidity ^0.5.0;

import "./Ownable.sol";

// TODO: I'm not sure if we should make Beneficiary its own contract. It seems like the correct thing to do,
// but I'm afraid of attack vectors between updating all the Beneficiary contract instances, i.e.,
// running out of gas, after having updated one, but not the other.
// Therefore, I inherit.

// We make Alice the owner in this. She is the only one who has negative-value
// arrangement, and if she stops acting on the contract, it is useless anyways.
// We do not allow her to withdraw funds though.
//
contract HasBeneficiaries is Ownable {

    struct Beneficiary {
        address addr;
        uint256 reservedAmount;
    }

    // I think this should be more general in future, i.e., array or mapping of multiple beneficiaries,
    // but this opens all kinds of cans of worms, so we keep it simple for now.
    // However, we make the contract API behave as if we had the more complex solution.
    //
    Beneficiary public _beneficiary0;
    Beneficiary public _beneficiary1;

    event BeneficiaryAdded(address indexed beneficiaryAddr);
    event BeneficiaryReservedAmountChanged(address indexed beneficiaryAddr, uint256 newAmount);

    constructor(address beneficiary0, address beneficiary1) public {
        _beneficiary0 = Beneficiary(beneficiary0, 0);
        _beneficiary1 = Beneficiary(beneficiary1, 0);

        emit BeneficiaryAdded(_beneficiary0.addr);
        emit BeneficiaryAdded(_beneficiary1.addr);
    }

    function getBeneficiaryAmount(address beneficiaryAddr) public view returns (uint256) {
        if(beneficiaryAddr == _beneficiary0.addr) {
            return _beneficiary0.reservedAmount;
        }
        if(beneficiaryAddr == _beneficiary1.addr) {
            return _beneficiary1.reservedAmount;
        }
        return 0;
    }

    function getBeneficiaryCount() public pure returns(uint8) {
        return 2;
    }

    function getTotalReservedAmount() public view returns(uint256) {
        uint256 sum = _beneficiary0.reservedAmount +
                      _beneficiary1.reservedAmount;

        assert(sum >= _beneficiary0.reservedAmount && sum >= _beneficiary1.reservedAmount);

        return sum;
    }

    function isBeneficiary(address addr) public view returns (bool) {
        return addr == _beneficiary0.addr ||
               addr == _beneficiary1.addr;
    }

    modifier onlyBeneficiary() {
        require(isBeneficiary(msg.sender));
        _;
    }

    function increaseReservedAmount(uint256 amount) internal onlyOwner {
        // Check that we have the funds.
        // (Should have already been enforced by caller -> assert)
        // Since all variables are uint256, this is also an overflow check for the following
        // two statements.
        //
        assert(address(this).balance >= _beneficiary0.reservedAmount +
                                        _beneficiary1.reservedAmount +
                                        2 * amount);

        _beneficiary0.reservedAmount += amount;
        _beneficiary1.reservedAmount += amount;

        emit BeneficiaryReservedAmountChanged(_beneficiary0.addr, _beneficiary0.reservedAmount);
        emit BeneficiaryReservedAmountChanged(_beneficiary1.addr, _beneficiary1.reservedAmount);
    }

    function resetBeneficiaryAmount() internal onlyBeneficiary {
        if(msg.sender == _beneficiary0.addr) {
            _beneficiary0.reservedAmount = 0;
            return;
        }

        if(msg.sender == _beneficiary1.addr) {
            _beneficiary1.reservedAmount = 0;
            return;
        }
    }
}
