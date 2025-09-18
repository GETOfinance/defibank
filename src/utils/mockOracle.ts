// Mock Oracle: Returns African currency prices relative to 1 USDT
// All prices are the amount of local currency per 1 USDT
// Example: NGN = 1600 means 1 USDT ~= 1600 NGN

export type AfricanCurrency =
  | 'NGN' | 'KES' | 'GHS' | 'ZAR' | 'UGX' | 'TZS' | 'MAD' | 'EGP' | 'XOF' | 'XAF'
  | 'ETB' | 'RWF' | 'ZMW' | 'MZN' | 'NAD' | 'BWP' | 'BIF' | 'CDF' | 'AOA' | 'DZD'
  | 'TND' | 'LYD' | 'SDG' | 'SOS' | 'SLL' | 'GMD' | 'LRD' | 'MGA' | 'GNF' | 'DJF'
  | 'ERN' | 'KMF' | 'ZWL' | 'SSP' | 'SCR' | 'SZL' | 'LSL' | 'MUR' | 'CVE';

export interface OraclePrice {
  symbol: AfricanCurrency;
  name: string;
  perUSDT: number; // local currency per 1 USDT
}

export const oraclePrices: OraclePrice[] = [
  { symbol: 'NGN', name: 'Nigerian Naira', perUSDT: 1600 },
  { symbol: 'KES', name: 'Kenyan Shilling', perUSDT: 130 },
  { symbol: 'GHS', name: 'Ghanaian Cedi', perUSDT: 15 },
  { symbol: 'ZAR', name: 'South African Rand', perUSDT: 18.5 },
  { symbol: 'UGX', name: 'Ugandan Shilling', perUSDT: 3800 },
  { symbol: 'TZS', name: 'Tanzanian Shilling', perUSDT: 2600 },
  { symbol: 'MAD', name: 'Moroccan Dirham', perUSDT: 10 },
  { symbol: 'EGP', name: 'Egyptian Pound', perUSDT: 48 },
  { symbol: 'XOF', name: 'West African CFA', perUSDT: 615 },
  { symbol: 'XAF', name: 'Central African CFA', perUSDT: 615 },
  { symbol: 'ETB', name: 'Ethiopian Birr', perUSDT: 115 },
  { symbol: 'RWF', name: 'Rwandan Franc', perUSDT: 1300 },
  { symbol: 'ZMW', name: 'Zambian Kwacha', perUSDT: 25 },
  { symbol: 'MZN', name: 'Mozambican Metical', perUSDT: 64 },
  { symbol: 'NAD', name: 'Namibian Dollar', perUSDT: 18.5 },
  { symbol: 'BWP', name: 'Botswana Pula', perUSDT: 13.5 },
  { symbol: 'BIF', name: 'Burundian Franc', perUSDT: 2900 },
  { symbol: 'CDF', name: 'Congolese Franc', perUSDT: 2700 },
  { symbol: 'AOA', name: 'Angolan Kwanza', perUSDT: 900 },
  { symbol: 'DZD', name: 'Algerian Dinar', perUSDT: 135 },
  { symbol: 'TND', name: 'Tunisian Dinar', perUSDT: 3.1 },
  { symbol: 'LYD', name: 'Libyan Dinar', perUSDT: 4.9 },
  { symbol: 'SDG', name: 'Sudanese Pound', perUSDT: 1100 },
  { symbol: 'SOS', name: 'Somali Shilling', perUSDT: 57000 },
  { symbol: 'SLL', name: 'Sierra Leonean Leone', perUSDT: 22500 },
  { symbol: 'GMD', name: 'Gambian Dalasi', perUSDT: 66 },
  { symbol: 'LRD', name: 'Liberian Dollar', perUSDT: 195 },
  { symbol: 'MGA', name: 'Malagasy Ariary', perUSDT: 4500 },
  { symbol: 'GNF', name: 'Guinean Franc', perUSDT: 8600 },
  { symbol: 'DJF', name: 'Djiboutian Franc', perUSDT: 178 },
  { symbol: 'ERN', name: 'Eritrean Nakfa', perUSDT: 15 },
  { symbol: 'KMF', name: 'Comorian Franc', perUSDT: 455 },
  { symbol: 'ZWL', name: 'Zimbabwean Dollar', perUSDT: 6200 },
  { symbol: 'SSP', name: 'South Sudanese Pound', perUSDT: 1300 },
  { symbol: 'SCR', name: 'Seychellois Rupee', perUSDT: 14.2 },
  { symbol: 'SZL', name: 'Swazi Lilangeni', perUSDT: 18.5 },
  { symbol: 'LSL', name: 'Lesotho Loti', perUSDT: 18.5 },
  { symbol: 'MUR', name: 'Mauritian Rupee', perUSDT: 46 },
  { symbol: 'CVE', name: 'Cape Verdean Escudo', perUSDT: 103 },
];

export function getOraclePrice(symbol: AfricanCurrency): OraclePrice | undefined {
  return oraclePrices.find(p => p.symbol === symbol);
}

// Helpers to convert between local currency stablecoin and USDT
export function localToUSDT(amountLocal: number, symbol: AfricanCurrency): number {
  const price = getOraclePrice(symbol);
  if (!price) return 0;
  return amountLocal / price.perUSDT; // local / (local per 1 usdt) = usdt
}

export function usdtToLocal(amountUSDT: number, symbol: AfricanCurrency): number {
  const price = getOraclePrice(symbol);
  if (!price) return 0;
  return amountUSDT * price.perUSDT; // usdt * (local per 1 usdt) = local
}

