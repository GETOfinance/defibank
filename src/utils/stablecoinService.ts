// Future Hedera integration service for stablecoin mint/burn
// For now, this stores balances and history in localStorage and offers a facade
// so we can swap in real Hedera contract calls later.

import { AfricanCurrency, localToUSDT } from './mockOracle'

export interface HoldingMap { [symbol: string]: number } // local currency balances
export interface HistoryItem {
  id: string
  timestamp: number
  address: string
  action: 'mint' | 'burn'
  symbol: AfricanCurrency
  amountLocal: number
  amountUSDT: number
}

const HOLDINGS_KEY = 'defibank_stablecoin_holdings'
const HISTORY_KEY = 'defibank_stablecoin_history'

// Old keys for migration
const OLD_HOLDINGS_KEY = 'flipper_stablecoin_holdings'
const OLD_HISTORY_KEY = 'flipper_stablecoin_history'

let migrated = false
function ensureMigration() {
  if (migrated || typeof window === 'undefined') return
  try {
    const hasNewHoldings = !!localStorage.getItem(HOLDINGS_KEY)
    const hasNewHistory = !!localStorage.getItem(HISTORY_KEY)
    const oldHoldings = localStorage.getItem(OLD_HOLDINGS_KEY)
    const oldHistory = localStorage.getItem(OLD_HISTORY_KEY)

    // Copy over only if new keys are empty and old keys exist
    if (!hasNewHoldings && oldHoldings) {
      localStorage.setItem(HOLDINGS_KEY, oldHoldings)
    }
    if (!hasNewHistory && oldHistory) {
      localStorage.setItem(HISTORY_KEY, oldHistory)
    }

    // Clean up old keys after copying
    localStorage.removeItem(OLD_HOLDINGS_KEY)
    localStorage.removeItem(OLD_HISTORY_KEY)
  } catch (e) {
    // ignore migration errors, use defaults
    console.debug('Stablecoin storage migration skipped:', e)
  } finally {
    migrated = true
  }
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function getHoldings(): HoldingMap {
  ensureMigration()
  return readJSON<HoldingMap>(HOLDINGS_KEY, {})
}

export function setHoldings(map: HoldingMap) {
  ensureMigration()
  writeJSON(HOLDINGS_KEY, map)
}

export function getHistory(): HistoryItem[] {
  ensureMigration()
  return readJSON<HistoryItem[]>(HISTORY_KEY, [])
}

export function addHistory(item: HistoryItem) {
  const history = getHistory()
  history.unshift(item)
  writeJSON(HISTORY_KEY, history)
}

export async function mintStablecoin(address: string, symbol: AfricanCurrency, amountLocal: number) {
  // Placeholder for Hedera contract call
  const amountUSDT = localToUSDT(amountLocal, symbol)
  const holdings = getHoldings()
  holdings[symbol] = (holdings[symbol] || 0) + amountLocal
  setHoldings(holdings)
  addHistory({ id: crypto.randomUUID(), timestamp: Date.now(), address, action: 'mint', symbol, amountLocal, amountUSDT })
  return { amountUSDT }
}

export async function burnStablecoin(address: string, symbol: AfricanCurrency, amountLocal: number) {
  // Placeholder for Hedera contract call
  const amountUSDT = localToUSDT(amountLocal, symbol)
  const holdings = getHoldings()
  holdings[symbol] = Math.max(0, (holdings[symbol] || 0) - amountLocal)
  setHoldings(holdings)
  addHistory({ id: crypto.randomUUID(), timestamp: Date.now(), address, action: 'burn', symbol, amountLocal, amountUSDT })
  return { amountUSDT }
}

