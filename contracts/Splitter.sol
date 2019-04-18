// TODO: Fix a version before release
//
pragma solidity ^0.5.0;

import "./HasBeneficiaries.sol";

contract Splitter is HasBeneficiaries {

    event SplitPerformed();
	event BeneficiaryWithdrew(address indexed beneficiaryAddr, uint256 amount);

    constructor(address beneficiary0, address beneficiary1) public
        HasBeneficiaries(beneficiary0, beneficiary1) {
    }

    // Let everyone pay this contract. In practice it will only be Alice,
    // but why refuse extra money?
    //
    function() external payable { }

    function splitAll() public onlyOwner {
        uint256 splittableFunds = address(this).balance - getTotalReservedAmount();

        assert(splittableFunds >= 0);

        // Detail: The integer divison rounds down, i.e., leaves remainders in account for later splits.
        //
        increaseReservedAmount(splittableFunds / getBeneficiaryCount());

        emit SplitPerformed();
    }

    function withdraw() external onlyBeneficiary {
        uint256 sendAmount = getBeneficiaryAmount(msg.sender);

        resetBeneficiaryAmount();

        msg.sender.transfer(sendAmount);

        emit BeneficiaryWithdrew(msg.sender, sendAmount);
    }
}