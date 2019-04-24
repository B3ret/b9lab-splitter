// TODO: Fix a version before release
//
pragma solidity ^0.5.0;

import "./Pausable.sol";

contract Splitter is Pausable {

    mapping(address => uint256) public _balances;

    event LogWithdraw(address indexed addr);

    event LogSplitFunds(address indexed sender, address indexed recipientOne, address indexed recipientTwo, uint256 paidAmount);

    /**
     * Explicitely disable the fallback from being payable
     * TODO: Can be removed in the future. (Default behavior for newer compilers.)
     */
    function() external {
        revert("PRE_NO_FALLBACK");
    }

    function getBalance(address recipient) public view returns(uint256) {
        return _balances[recipient];
    }

    /**
     * If an odd amount of wei is sent, the odd wei is credited to the owners account.
     * If you want to avoid this, send an even amount of wei.
     *
     * WARNING: There are no overflow checks on the balances in here, because of the high
     * unlikelyhood of someone racking up ether balances large enough to do that.
     */
    function splitFunds(address recipientOne, address recipientTwo) external payable whenNotPaused {
        require(recipientOne != address(0), "PRE_ADDRESS_WAS_NULL");
        require(recipientTwo != address(0), "PRE_ADDRESS_WAS_NULL");

        // Integer division rounds down.
        //
        uint256 halfAmount = msg.value / 2;

        _balances[recipientOne] += halfAmount;
        _balances[recipientTwo] += halfAmount;

        // If the sender sends an odd amount, we'll put that extra wei into
        // the owners account, so he can collect the dust in case it accumulates.
        //
        _balances[owner()] += msg.value % 2;

        emit LogSplitFunds(msg.sender, recipientOne, recipientTwo, msg.value);
    }

    /**
     * Withdraw any balance you have.
     * This function is not pausable, so the users can get their balance out, even if the
     * contract is paused.
     */
    function withdraw() external {
        uint256 sendAmount = _balances[msg.sender];

        require(sendAmount > 0, "PRE_BALANCE_WAS_ZERO");

        _balances[msg.sender] = 0;

        emit LogWithdraw(msg.sender);

        msg.sender.transfer(sendAmount);
    }
}