export const IERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
] as const;

export const ORBITAL_POOL_ABI = [
  // tokens(uint256) -> address
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "tokens",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // _getTotalReserves() -> uint256[5]
  {
    inputs: [],
    name: "_getTotalReserves",
    outputs: [
      { name: "", type: "uint256[5]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // swap(uint256 tokenIn, uint256 tokenOut, uint256 amountIn, uint256 minAmountOut)
  {
    inputs: [
      { name: "tokenIn", type: "uint256" },
      { name: "tokenOut", type: "uint256" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
    ],
    name: "swap",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // addLiquidity(uint256 k, uint256[5] amounts)
  {
    inputs: [
      { name: "k", type: "uint256" },
      { name: "amounts", type: "uint256[5]" },
    ],
    name: "addLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // removeLiquidity(uint256 k, uint256 lpSharesToRemove)
  {
    inputs: [
      { name: "k", type: "uint256" },
      { name: "lpSharesToRemove", type: "uint256" },
    ],
    name: "removeLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getLpShares(uint256 k, address user)
  {
    inputs: [
      { name: "k", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getLpShares",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getTickLiquidity, getTickStatus
  {
    inputs: [{ name: "k", type: "uint256" }],
    name: "getTickLiquidity",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "k", type: "uint256" }],
    name: "getTickStatus",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export type FiveTokenArray = [string, string, string, string, string];

