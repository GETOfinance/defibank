// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStableOracle {
    /// @notice Returns local currency units per 1 USDT, scaled by 1e18
    /// Example: if 1 USDT = 1600 NGN, returns 1600e18 for symbol bytes32("NGN")
    function localPerUSDT(bytes32 symbol) external view returns (uint256);
}

