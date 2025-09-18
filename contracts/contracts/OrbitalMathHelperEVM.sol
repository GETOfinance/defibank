// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OrbitalMathHelperEVM
 * @notice EVM Solidity implementation of the math helper used by OrbitalPool
 * @dev Matches the IOrbitalMathHelper interface expected by IntegratedOrbital.sol
 *      Provides a spherical-invariant based approximation that is safe on EVM.
 *      Returns 0 on any invalid/unsafe condition so the caller can fallback.
 */
contract OrbitalMathHelperEVM {
    /**
     * @notice Solves the (approximate) invariant to calculate swap output amount
     * @dev ABI must match exactly the signature used by OrbitalPool low-level call
     *      Unused parameters are kept for ABI compatibility and future extensions.
     * @param sum_interior_reserves Unused in this EVM scaffold (kept for ABI)
     * @param interior_consolidated_radius Unused in this EVM scaffold (kept for ABI)
     * @param boundary_consolidated_radius Unused in this EVM scaffold (kept for ABI)
     * @param boundary_total_k_bound Unused in this EVM scaffold (kept for ABI)
     * @param total_reserves Current total reserves across all tokens
     * @param token_in_index Index of the input token
     * @param token_out_index Index of the output token
     * @param amount_in_after_fee Input amount after fee deduction
     * @return The computed output amount (0 if not solvable)
     */
    function solveTorusInvariant(
        uint256 sum_interior_reserves,
        uint256 interior_consolidated_radius,
        uint256 boundary_consolidated_radius,
        uint256 boundary_total_k_bound,
        uint256[] memory total_reserves,
        uint256 token_in_index,
        uint256 token_out_index,
        uint256 amount_in_after_fee
    ) external pure returns (uint256) {
        // Silence unused warnings (ABI compatibility)
        (sum_interior_reserves, interior_consolidated_radius, boundary_consolidated_radius, boundary_total_k_bound);

        // Basic validations
        if (total_reserves.length == 0) return 0;
        if (token_in_index >= total_reserves.length) return 0;
        if (token_out_index >= total_reserves.length) return 0;
        if (token_in_index == token_out_index) return 0;

        uint256 rIn = total_reserves[token_in_index];
        uint256 rOut = total_reserves[token_out_index];
        uint256 dx = amount_in_after_fee;

        if (dx == 0 || rIn == 0 || rOut == 0) return 0;

        // Spherical invariant approximation:
        // Preserve K = ||r||^2 while increasing rIn by dx and decreasing rOut by dy
        // Derived 2*rIn*dx + dx^2 = 2*rOut*dy - dy^2  =>  dy = rOut - sqrt(rOut^2 - (2*rIn*dx + dx^2))
        // All calculations guarded against overflow; returns 0 if unsafe.

        // Compute rOut^2 with overflow guard
        uint256 rOutSquared;
        unchecked {
            // Check for overflow: rOut * rOut overflows if rOut > max / rOut
            if (rOut != 0 && rOut > type(uint256).max / rOut) return 0;
            rOutSquared = rOut * rOut;
        }

        // Compute prod = rIn * dx with overflow guard
        uint256 prod;
        unchecked {
            if (dx != 0 && rIn > type(uint256).max / dx) return 0;
            prod = rIn * dx;
        }

        // Compute twoRInDx = 2 * prod with overflow guard
        uint256 twoRInDx;
        unchecked {
            if (prod > type(uint256).max / 2) return 0;
            twoRInDx = prod * 2;
        }

        // Compute dx^2 with overflow guard
        uint256 dxSquared;
        unchecked {
            if (dx != 0 && dx > type(uint256).max / dx) return 0;
            dxSquared = dx * dx;
        }

        // sum = 2*rIn*dx + dx^2; must be <= rOut^2
        uint256 sum;
        unchecked {
            if (twoRInDx > type(uint256).max - dxSquared) return 0;
            sum = twoRInDx + dxSquared;
        }
        if (sum >= rOutSquared) return 0;

        // radicand = rOut^2 - sum
        uint256 radicand = rOutSquared - sum;
        uint256 sqrtVal = _sqrt(radicand);
        if (sqrtVal >= rOut) return 0; // numerical guard

        uint256 dy = rOut - sqrtVal;
        if (dy == 0 || dy >= rOut) return 0;
        return dy;
    }

    // Babylonian method for integer square root
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}

