// Client-side quote using spherical invariant approximation
// Falls back to simple constant product if needed

export type Reserves = bigint[]; // length 5 in base units

export function sphericalQuoteOut(
  reserves: Reserves,
  tokenIn: number,
  tokenOut: number,
  amountInAfterFee: bigint
): bigint {
  // Simple robust fallback for now; we can evolve to a closer approximation of _calculateSwapOutput
  const xIn = reserves[tokenIn];
  const yOut = reserves[tokenOut];
  if (!xIn || !yOut || xIn === BigInt(0) || yOut === BigInt(0)) return BigInt(0);
  const num = amountInAfterFee * yOut;
  const den = xIn + amountInAfterFee;
  if (den === BigInt(0)) return BigInt(0);
  // safety margin 2%
  return (num / den) * BigInt(98) / BigInt(100);
}

export function priceImpact(
  reserves: Reserves,
  tokenIn: number,
  tokenOut: number,
  amountIn: bigint
): number {
  const out1 = sphericalQuoteOut(reserves, tokenIn, tokenOut, amountIn);
  const midPrice = Number(reserves[tokenOut]) / Math.max(1, Number(reserves[tokenIn]));
  const effective = Number(out1) / Math.max(1, Number(amountIn));
  if (midPrice === 0) return 0;
  return ((midPrice - effective) / midPrice) * 100;
}

