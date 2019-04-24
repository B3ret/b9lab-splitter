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

        // Integer division rounds down.
        //
        uint256 halfAmount = msg.value / 2;

        _balances[recipientOne] += halfAmount;
        _balances[recipientTwo] += halfAmount;

        // If the sender sends an odd amount, we'll put that extra wei into
        // the owners account, so he can collect the dust in case it accumulates.
        //
        bool hasDust = (msg.value % 2) > 0;
        if(hasDust) {
            _balances[owner()]++;
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