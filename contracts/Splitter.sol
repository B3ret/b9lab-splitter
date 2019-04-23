// TODO: Fix a version before release
//
pragma solidity ^0.5.0;

import "./Pausable.sol";

contract Splitter is Pausable {

    mapping(address => uint256) public _balances;

    event LogWithdraw(address indexed addr, uint256 newAmount);

    event LogSplitFunds(address indexed sender, address indexed recipientOne, address indexed recipientTwo, uint256 paidAmount);

    // Explicitely disable the fallback from being payable
    //
    function() external { }

    function getBalance(address recipient) public view returns(uint256) {
        return _balances[recipient];
    }

    /**
     * If an odd amount of wei is sent, the odd wei is credited to the owners account.
     * If you want to avoid this, send an even amount of wei.
     */
    function splitFunds(address recipientOne, address recipientTwo) external payable whenNotPaused {
        require(recipientOne != address(0), "PRE_ADDRESS_WAS_NULL");
        require(recipientTwo != address(0), "PRE_ADDRESS_WAS_NULL");
        require(recipientOne != recipientTwo, "PRE_ADDRESSES_WERE_NOT_DIFFERENT");

        uint256 amount = msg.value / 2;

        uint256 newAmountOne = _balances[recipientOne] + amount;
        uint256 newAmountTwo = _balances[recipientTwo] + amount;

        require(newAmountOne >= _balances[recipientOne] && newAmountOne >= amount, "ERR_WOULD_OVERFLOW");
        require(newAmountTwo >= _balances[recipientTwo] && newAmountTwo >= amount, "ERR_WOULD_OVERFLOW");

        _balances[recipientOne] = newAmountOne;
        _balances[recipientTwo] = newAmountTwo;

        // If the sender sends an odd amount, we'll put that extra wei into
        // the owners account, so he can collect the dust in case it accumulates.
        // (This has to be after the first two updates, in case owner is also one
        //  of the recipients.)
        //
        bool hasDust = (msg.value % 2) > 0;
        if(hasDust) {
            uint256 newBalanceOwner = _balances[owner()] + 1;
            require(newBalanceOwner >= _balances[owner()], "ERR_WOULD_OVERFLOW");
            _balances[owner()] = newBalanceOwner;
        }

        emit LogSplitFunds(msg.sender, recipientOne, recipientTwo, msg.value);
    }

    function withdraw() external {
        uint256 sendAmount = _balances[msg.sender];

        require(sendAmount > 0, "PRE_BALANCE_WAS_ZERO");

        _balances[msg.sender] = 0;

        msg.sender.transfer(sendAmount);

        emit LogWithdraw(msg.sender, 0);
    }
}