// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IStableOracle} from "../interfaces/IStableOracle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Simple owner-settable oracle: localPerUSDT in 1e18 per symbol
contract MockStableOracle is IStableOracle, Ownable {
    mapping(bytes32 => uint256) public price; // local per USDT, 1e18

    constructor(address owner_) Ownable(owner_) {}

    function localPerUSDT(bytes32 symbol) external view override returns (uint256) {
        return price[symbol];
    }

    function setPrice(bytes32 symbol, uint256 localPerUsdt1e18) external onlyOwner {
        price[symbol] = localPerUsdt1e18;
    }
}

