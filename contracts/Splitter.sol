// TODO: Fix a version before release
//
pragma solidity ^0.5.0;

import "./Pausable.sol";

contract Splitter is Pausable {

    mapping(address => uint256) public _balances;

    event BalanceChanged(address indexed addr, uint256 newAmount);

    // Explicitely disable the fallback from being payable
    //
    function() external { }

    function getBalance(address recipient) public view returns(uint256) {
        return _balances[recipient];
    }

    function splitFunds(address recipientOne, address recipientTwo) external payable whenNotPaused {
        require(recipientOne != address(0));
        require(recipientTwo != address(0));

        // If the sender sends an odd amount of ether, we'll pay recipientOne one
        // wei more. This is better than any alternative:
        //  - Reverting will cost the sender much more than 1 wei
        //  - Randomly assigning one wei also costs much more than 1 wei. If the sender wants,
        //    he can randomly swap recipientOne and recipientTwo.

        uint256 amountTwo = msg.value / 2;
        uint256 amountOne = msg.value - amountTwo;

        uint256 newAmountOne = _balances[recipientOne] + amountOne;
        uint256 newAmountTwo = _balances[recipientTwo] + amountTwo;

        require(newAmountOne >= _balances[recipientOne] && newAmountOne >= amountOne);
        require(newAmountTwo >= _balances[recipientTwo] && newAmountTwo >= amountTwo);

        _balances[recipientOne] = newAmountOne;
        _balances[recipientTwo] = newAmountTwo;

        emit BalanceChanged(recipientOne, newAmountOne);
        emit BalanceChanged(recipientTwo, newAmountTwo);
    }

    function withdraw() external {
        uint256 sendAmount = _balances[msg.sender];

        require(sendAmount > 0);

        _balances[msg.sender] = 0;

        msg.sender.transfer(sendAmount);

        emit BalanceChanged(msg.sender, 0);
    }
}