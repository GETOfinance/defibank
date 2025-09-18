// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IStableOracle} from "../interfaces/IStableOracle.sol";

/**
 * @title StableCoins (multi-currency balances with collateral enforcement)
 * @notice On-chain ledger for African currency "stablecoins" with per-user balances
 *         and collateralization checks against a USDT reserve using an oracle.
 *
 *         Decimals: 6 (like USDC/USDT) for all currencies.
 *
 *         Access control: only addresses with Minter role can mint; any holder can burn.
 *         Owner can configure symbols, oracle, minters, and manage reserves.
 */
contract StableCoins is Ownable {
    uint8 public constant DECIMALS = 6; // local currency decimals (and USDT assumed 6)

    IERC20 public immutable usdt;          // backing asset (6 decimals assumed)
    IStableOracle public oracle;           // returns localPerUSDT 1e18




    // Mapping: user => currency (bytes32 symbol) => balance in 10^6
    mapping(address => mapping(bytes32 => uint256)) private _balances;

    // Supported currency codes
    mapping(bytes32 => bool) public supported;
    bytes32[] public symbols;

    // Per-currency reserves and liabilities, in USDT 1e6
    mapping(bytes32 => uint256) public reservesUSDT;    // tracked via fund/withdraw
    mapping(bytes32 => uint256) public liabilitiesUSDT; // tracked via mint/burn at oracle rate

    event Mint(address indexed user, bytes32 indexed symbol, uint256 amountLocal, uint256 requiredUSDT);
    event Burn(address indexed user, bytes32 indexed symbol, uint256 amountLocal, uint256 releasedUSDT);
    event SupportedSet(bytes32 indexed symbol, bool isSupported);
    event OracleSet(address indexed oracle);

    event ReserveFunded(bytes32 indexed symbol, uint256 amountUSDT);
    event ReserveWithdrawn(bytes32 indexed symbol, address indexed to, uint256 amountUSDT);

    constructor(
        address owner_,
        address usdt_,
        address oracle_,
        bytes32[] memory initialSymbols
    ) Ownable(owner_) {
        require(usdt_ != address(0), "usdt=0");
        usdt = IERC20(usdt_);
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



    // ----- Reserves management (USDT) -----
    function fundReserves(bytes32 symbol, uint256 amountUSDT) external onlyOwner {
        require(isSupported(symbol), "symbol");
        require(amountUSDT > 0, "amount");
        require(usdt.transferFrom(msg.sender, address(this), amountUSDT), "transferFrom");
        reservesUSDT[symbol] += amountUSDT;
        emit ReserveFunded(symbol, amountUSDT);
    }

    function withdrawExcess(bytes32 symbol, address to, uint256 amountUSDT) external onlyOwner {
        require(to != address(0), "to=0");
        uint256 excess = _excessReserve(symbol);
        require(amountUSDT <= excess, "exceeds excess");
        reservesUSDT[symbol] -= amountUSDT; // track attributed reserves
        require(usdt.transfer(to, amountUSDT), "transfer");
        emit ReserveWithdrawn(symbol, to, amountUSDT);
    }

    function _excessReserve(bytes32 symbol) internal view returns (uint256) {
        uint256 r = reservesUSDT[symbol];
        uint256 l = liabilitiesUSDT[symbol];
        return r > l ? (r - l) : 0;
    }

    // ----- Core logic -----
    function mint(bytes32 symbol, uint256 amountLocal) external {
        require(isSupported(symbol), "symbol");
        require(amountLocal > 0, "amount");
        uint256 reqUSDT = _usdtForLocal(symbol, amountLocal);
        // User must deposit USDT: transferFrom user to contract
        require(usdt.transferFrom(msg.sender, address(this), reqUSDT), "transferFrom");
        reservesUSDT[symbol] += reqUSDT;
        _balances[msg.sender][symbol] += amountLocal;
        liabilitiesUSDT[symbol] += reqUSDT;
        emit Mint(msg.sender, symbol, amountLocal, reqUSDT);
    }

    function burn(bytes32 symbol, uint256 amountLocal) external {
        require(isSupported(symbol), "symbol");
        uint256 bal = _balances[msg.sender][symbol];
        require(bal >= amountLocal && amountLocal > 0, "insufficient");
        unchecked { _balances[msg.sender][symbol] = bal - amountLocal; }
        uint256 relUSDT = _usdtForLocal(symbol, amountLocal);
        uint256 liab = liabilitiesUSDT[symbol];
        liabilitiesUSDT[symbol] = relUSDT >= liab ? 0 : (liab - relUSDT);
        // redeem USDT to user and reduce reserves
        require(reservesUSDT[symbol] >= relUSDT, "reserve");
        reservesUSDT[symbol] -= relUSDT;
        require(usdt.transfer(msg.sender, relUSDT), "transfer");
        emit Burn(msg.sender, symbol, amountLocal, relUSDT);
    }

    // Helper: converts local amount (1e6) to USDT amount (1e6) using oracle localPerUSDT (1e18)
    function _usdtForLocal(bytes32 symbol, uint256 amountLocal) internal view returns (uint256) {
        uint256 p = oracle.localPerUSDT(symbol); // local per 1 USDT, 1e18
        require(p > 0, "oracle");
        // amountUSDT_1e6 = amountLocal_1e6 * 1e18 / p
        return (amountLocal * 1e18) / p;
    }


}

