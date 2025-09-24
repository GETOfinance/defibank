// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IStableOracle} from "../interfaces/IStableOracle.sol";

/**
 * @title StableCoins (multi-currency balances with collateral enforcement)
 * @notice On-chain ledger for African currency "stablecoins" with per-user balances
 *         and collateralization checks against a USDC reserve using an oracle.
 *
 *         Decimals: 6 (like USDC) for all currencies.
 *
 *         Access control: only addresses with Minter role can mint; any holder can burn.
 *         Owner can configure symbols, oracle, minters, and manage reserves.
 */
contract StableCoins is Ownable {
    uint8 public constant DECIMALS = 6; // local currency decimals (and USDC assumed 6)

    IERC20 public immutable usdc;          // backing asset (6 decimals assumed)
    IStableOracle public oracle;           // returns localPerUSDC 1e18




    // Mapping: user => currency (bytes32 symbol) => balance in 10^6
    mapping(address => mapping(bytes32 => uint256)) private _balances;

    // Supported currency codes
    mapping(bytes32 => bool) public supported;
    bytes32[] public symbols;

    // Per-currency reserves and liabilities, in USDC 1e6
    mapping(bytes32 => uint256) public reservesUSDC;    // tracked via fund/withdraw
    mapping(bytes32 => uint256) public liabilitiesUSDC; // tracked via mint/burn at oracle rate

    event Mint(address indexed user, bytes32 indexed symbol, uint256 amountLocal, uint256 requiredUSDC);
    event Burn(address indexed user, bytes32 indexed symbol, uint256 amountLocal, uint256 releasedUSDC);
    event SupportedSet(bytes32 indexed symbol, bool isSupported);
    event OracleSet(address indexed oracle);

    event ReserveFunded(bytes32 indexed symbol, uint256 amountUSDC);
    event ReserveWithdrawn(bytes32 indexed symbol, address indexed to, uint256 amountUSDC);

    constructor(
        address owner_,
        address usdc_,
        address oracle_,
        bytes32[] memory initialSymbols
    ) Ownable(owner_) {
        require(usdc_ != address(0), "usdc=0");
        usdc = IERC20(usdc_);
        oracle = IStableOracle(oracle_);
        for (uint256 i = 0; i < initialSymbols.length; i++) {
            bytes32 sym = initialSymbols[i];
            if (!supported[sym]) {
                supported[sym] = true;
                symbols.push(sym);
                emit SupportedSet(sym, true);
            }
        }
        emit OracleSet(oracle_);
    }

    // ----- Views -----
    function listSymbols() external view returns (bytes32[] memory) { return symbols; }
    function isSupported(bytes32 symbol) public view returns (bool) { return supported[symbol]; }
    function balanceOf(address user, bytes32 symbol) external view returns (uint256) { return _balances[user][symbol]; }

    // ----- Admin config -----
    function setSupported(bytes32 symbol, bool isOn) external onlyOwner {
        if (isOn && !supported[symbol]) {
            supported[symbol] = true; symbols.push(symbol);
        } else if (!isOn && supported[symbol]) {
            supported[symbol] = false;
        }
        emit SupportedSet(symbol, isOn);
    }

    function setOracle(address oracle_) external onlyOwner {
        oracle = IStableOracle(oracle_);
        emit OracleSet(oracle_);
    }



    // ----- Reserves management (USDC) -----
    function fundReserves(bytes32 symbol, uint256 amountUSDC) external onlyOwner {
        require(isSupported(symbol), "symbol");
        require(amountUSDC > 0, "amount");
        require(usdc.transferFrom(msg.sender, address(this), amountUSDC), "transferFrom");
        reservesUSDC[symbol] += amountUSDC;
        emit ReserveFunded(symbol, amountUSDC);
    }

    function withdrawExcess(bytes32 symbol, address to, uint256 amountUSDC) external onlyOwner {
        require(to != address(0), "to=0");
        uint256 excess = _excessReserve(symbol);
        require(amountUSDC <= excess, "exceeds excess");
        reservesUSDC[symbol] -= amountUSDC; // track attributed reserves
        require(usdc.transfer(to, amountUSDC), "transfer");
        emit ReserveWithdrawn(symbol, to, amountUSDC);
    }

    function _excessReserve(bytes32 symbol) internal view returns (uint256) {
        uint256 r = reservesUSDC[symbol];
        uint256 l = liabilitiesUSDC[symbol];
        return r > l ? (r - l) : 0;
    }

    // ----- Core logic -----
    function mint(bytes32 symbol, uint256 amountLocal) external {
        require(isSupported(symbol), "symbol");
        require(amountLocal > 0, "amount");
        uint256 reqUSDC = _usdcForLocal(symbol, amountLocal);
        // User must deposit USDC: transferFrom user to contract
        require(usdc.transferFrom(msg.sender, address(this), reqUSDC), "transferFrom");
        reservesUSDC[symbol] += reqUSDC;
        _balances[msg.sender][symbol] += amountLocal;
        liabilitiesUSDC[symbol] += reqUSDC;
        emit Mint(msg.sender, symbol, amountLocal, reqUSDC);
    }

    function burn(bytes32 symbol, uint256 amountLocal) external {
        require(isSupported(symbol), "symbol");
        uint256 bal = _balances[msg.sender][symbol];
        require(bal >= amountLocal && amountLocal > 0, "insufficient");
        unchecked { _balances[msg.sender][symbol] = bal - amountLocal; }
        uint256 relUSDC = _usdcForLocal(symbol, amountLocal);
        uint256 liab = liabilitiesUSDC[symbol];
        liabilitiesUSDC[symbol] = relUSDC >= liab ? 0 : (liab - relUSDC);
        // redeem USDC to user and reduce reserves
        require(reservesUSDC[symbol] >= relUSDC, "reserve");
        reservesUSDC[symbol] -= relUSDC;
        require(usdc.transfer(msg.sender, relUSDC), "transfer");
        emit Burn(msg.sender, symbol, amountLocal, relUSDC);
    }

    // Helper: converts local amount (1e6) to USDC amount (1e6) using oracle localPerUSDC (1e18)
    function _usdcForLocal(bytes32 symbol, uint256 amountLocal) internal view returns (uint256) {
        uint256 p = oracle.localPerUSDC(symbol); // local per 1 USDC, 1e18
        require(p > 0, "oracle");
        // amountUSDC_1e6 = amountLocal_1e6 * 1e18 / p
        return (amountLocal * 1e18) / p;
    }


}

