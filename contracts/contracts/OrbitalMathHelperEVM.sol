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
     * @notice Calculates the radius of a tick from its reserves
     * @dev Returns floor(sqrt(sum(reserve_i^2))) with basic overflow guards
     */
    function calculateRadius(uint256[] memory reserves) external pure returns (uint256) {
        if (reserves.length == 0) return 0;
        unchecked {
            uint256 sumSquares = 0;
            for (uint256 i = 0; i < reserves.length; i++) {
                uint256 x = reserves[i];
                if (x != 0 && x > type(uint256).max / x) return 0; // overflow guard for x*x
                uint256 xsq = x * x;
                if (sumSquares > type(uint256).max - xsq) return 0; // overflow guard for sum
                sumSquares += xsq;
            }
            return _sqrt(sumSquares);
        }
    }

    /**
     * @notice Calculates the s value for a boundary tick
     * @dev Simple approximation: use radius as s (kept for ABI compatibility)
     */
    function calculateBoundaryTickS(uint256 r, uint256 /*k*/ ) external pure returns (uint256) {
        return r;
    }

    /**
     * @notice Solves the (approximate) invariant to calculate swap output amount
     * @dev ABI must match exactly the signature used by OrbitalPool low-level call
     *      Unused parameters are kept for ABI compatibility and future extensions.
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

        // Preserve K = ||r||^2 while increasing rIn by dx and decreasing rOut by dy:
        // 2*rIn*dx + dx^2 = 2*rOut*dy - dy^2  =>  dy = rOut - sqrt(rOut^2 - (2*rIn*dx + dx^2))

        // Compute rOut^2 with overflow guard
        uint256 rOutSquared;
        unchecked {
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

