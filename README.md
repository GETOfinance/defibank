# DeFi Bank (Super Crypto dApp in Africa)

 DeFi Bank, a DeFi web app targeting Hedera Testnet (EVM, chainId 296). It provides protected transfers (send to address/username with claim/refund), group payments, savings pots, stablecoin mint/burn (mock oracle or on-chain if configured), an experimental Revolutionary spherical-geometry AMM ("Orbital"), a wallet‑gated Loans UI, and unified history — all with modern UI/UX.

---

## Table of Contents
- Overview
- Tech Stack
- Screenshots & GIFs

- Features
  - Protected Transfers
  - Group Payments
  - Savings Pots
  - StableCoins (African currencies)
  - Exchange (Orbital AMM)
  - Orbital Pool (advanced)
  - Escrow Contracts
  - Loans (UI)
  - Transaction History
- How to Run Locally
- Configuration (.env)
- Smart Contracts (Hardhat)
- Useful Commands
- Notes, Disclaimers, and Roadmap

---

## Overview
DeFi Bank focuses on practical payments and pooled finance on Hedera Testnet:
- Simple, protected transfers that can be claimed by address, username, or ID.
- Split payments with friends/teams via group payments.
- Savings pots with target amounts and contributions.
- Local‑currency stablecoins UX (mock oracle), with optional on‑chain StableCoins + USDC integration.
- Experimental AMM based on spherical geometry/orbital mechanics with a dedicated UI.
- Loans UI (static prototype) for future lending/borrowing workflows.

## Tech Stack
- Frontend: Next.js (App Router), React 18, TypeScript, Tailwind CSS
- UI/UX: Framer Motion, Heroicons, next-themes
- Web3: wagmi + RainbowKit, ethers.js v5
- Contracts: Solidity + Hardhat (deploy/verify/smoke scripts)
- Chain: Hedera Testnet (EVM, chainId 296)


## Screenshots & GIFs

Place screenshots/GIFs under `public/screenshots/` so they render on GitHub using relative paths.
Suggested captures and filenames (you can rename):

- Landing: `landing.png`
- Dashboard: `dashboard.png`
- Transfer flow: `transfer-send.png`, `transfer-claim.png`
- Group Payments: `group-create.png`, `group-contribute.png`
- Savings Pots: `savings-create.png`, `savings-progress.png`
- StableCoins mint/burn GIF: `stablecoins-mint.gif`
- Exchange swap GIF: `exchange-swap.gif`
- Orbital Pool: `orbital-pool.png`
- Loans UI: `loans.png`
- History: `history.png`

Preview embed (will display once you drop files into `public/screenshots/`):

![Landing](./public/screenshots/landing.png)
![Dashboard](./public/screenshots/dashboard.png)

![StableCoins Mint](./public/screenshots/stablecoins-mint.gif)
![Exchange Swap](./public/screenshots/exchange-swap.gif)

![Group Payment Create](./public/screenshots/group-create.png)
![Group Payment Contribute](./public/screenshots/group-contribute.png)

![Savings Pots](./public/screenshots/savings-progress.png)
![Loans](./public/screenshots/loans.png)

![Orbital Pool](./public/screenshots/orbital-pool.png)
![History](./public/screenshots/history.png)

---

## Features

### 1) Protected Transfers
What for: safer P2P payments with optional claim flow.
- Send to address or to a registered username
- Recipient can claim by address/username/transferId
- Sender can refund a pending transfer
- Pending transfers listing
How to use:
1. Connect wallet on Hedera Testnet (chainId 296)
2. From Dashboard → Transfer, choose send method, amount, and remarks
3. Share the claim reference (if using username/ID)
4. Recipient navigates to claim flow; sender can refund if unclaimed

### 2) Group Payments
What for: split a bill or crowdfund.
- Create a group payment (recipient, participants, total amount, remarks)
- Share the auto-generated Payment ID
- Anyone can contribute via Payment ID; auto-fills required amount if reachable
- Progress bar tracks amountCollected vs totalAmount
How to use:
1. Dashboard → Group Payments → Create Group Payment
2. Share Payment ID with contributors
3. Contributors: Dashboard → Group Payments → Contribute to Payment
4. Watch progress; completes when full amount collected

### 3) Savings Pots
What for: save towards a goal.
- Create a pot (name, target amount, remarks)
- Contribute over time; optionally break pot early
How to use:
1. Dashboard → Saving Pots → Create a new pot
2. Contribute using the pot’s ID
3. Break pot to withdraw if needed

### 4) StableCoins (African currencies)
What for: mint/burn local-currency stablecoins for remittance and FX UX.
- Built-in Mock Oracle maps ~40+ African currencies to USDC
- Mint: provide local amount → calculates required USDC
- Burn: redeem USDC by burning local stablecoin
- On-chain mode (optional): If StableCoins and USDC contract addresses are configured, actions execute on-chain with allowance checks
How to use:
1. Dashboard → StableCoins
2. Pick a currency (e.g., NGN, KES, ZAR); enter local amount
3. Mint or Burn; review preview text
4. If on-chain contracts are set, approve USDC and complete the tx; else local mock ledger updates

### 5) Exchange (Orbital AMM)
What for: experimental spherical-geometry AMM.
- Swap tab: uses fixed FX rates for the demo (1 USDC = 18.5 ZAR, 1600 NGN, 130 KES, 3800 UGX); applies local reserve caps; no on-chain tx in demo mode
- Liquidity tab: add/remove multi-asset liquidity; when typing USDC, ZAR/NGN/KES/UGX auto-fill using the fixed FX rates (k is ignored for this auto-fill)
- Analytics tab: placeholder metrics/insights
How to use:
1. Connect wallet
2. Dashboard → Exchange
3. Use tabs to swap, provide liquidity, or view analytics

### 6) Orbital Pool (advanced view)
What for: deep-dive into the Orbital protocol state.
- Protocol intro cards, pool composition, reserves, mini-stats
- Same swap/liquidity actions if addresses are configured
How to use:
1. Connect wallet, navigate to Dashboard → Orbital Pool
2. Explore pool tokens, reserves, and actions

### 7) Escrow Contracts
What for: secure buyer–seller transactions with expiry and dispute resolution.
- Create contract with title, description, seller address, amount (HBAR), and expiry date
- Funds lock in EscrowHub; 2% platform fee; minimum 0.001 HBAR
- Buyer confirms delivery to release funds; after expiry the seller can claim; seller/owner can refund before delivery
How to use:
1. Connect wallet → Dashboard → Escrow
2. Create a new escrow, then manage from the list (Confirm Delivery / Claim / Refund)


### 8) Loans (UI prototype)
What for: future lending/borrowing workflows.
- Wallet-gated UI that mirrors the attached design
- Pool stats, Lending (Deposit/Withdraw), Borrowing panels
- Tabs for ETH/USDC assets; cross-collateral info
- Action buttons are disabled (UI only, no contract calls yet)
How to use:
1. Connect wallet, then Dashboard → Loans
2. Interact with tabs/inputs to explore the UX (no on-chain effects yet)

### 9) Transaction History
What for: single place to see activity.
- Aggregates Transfers, Group Payments, and Savings Pots
- Filter tabs, pagination, status chips
How to use:
1. Connect wallet → Dashboard → History
2. Filter by type or refresh to fetch latest on-chain state

---
## 🧭 Codebase Index (High Level)

```
./
├─ README.md (this file)
├─ paystablecoins20AllWoringEscrowFinalFinalFinal/   ← main app
│  ├─ src/                  Next.js App Router (UI)
│  │  ├─ app/              Routes: dashboard, transfer, escrow, exchange, loans, etc.
│  │  ├─ components/       UI components (escrow, QR, orbital)
│  │  ├─ hooks/            useEscrow, useOrbital, useLoans, etc.
│  │  ├─ utils/            contract clients (escrow, stablecoins, ERC‑20, orbital)
│  │  └─ context/          Wallet (RainbowKit/wagmi) provider
│  ├─ contracts/           Solidity (EscrowHub, ProtectedPay, StableCoins, Orbital, Loans)
│  ├─ public/              icons, screenshots
│  ├─ diagrams/            Mermaid sources (architecture, flows)
│  └─ package.json         app scripts (dev/build/deploy)
```


## 🧱 System Architecture

```
+-----------------------------------------------------------------------------------+
|                                   Browser (Next.js React UI)                      |
|  - Pages (App Router): dashboard, transfer, escrow, exchange, loans, etc.         |
|  - Components & Hooks: useEscrow, useOrbital, useLoans, QR scanner                 |
|  - Wallet Provider: RainbowKit / wagmi (WalletConnect, MetaMask)                  |
+---------------------------+------------------------------+------------------------+
                            |                              |
                            v                              v
                  +------------------+             +---------------------------+
                  | Client Utilities |             |  RPC Provider (viem/ethers)|
                  |  src/utils/*     |             |  -> https://testnet.hashio.io |
                  |  - escrow client |             +---------------------------+
                  |  - contract.ts   |                          |
                  |  - erc20 client  |                          v
                  |  - stablecoins    |               +------------------------------+
                  |  - orbital client |               | Hedera EVM (Chain ID 296)    |
                  +------------------+               | - ProtectedPay               |
                                                     | - EscrowHub                  |
                                                     | - StableCoins + Oracle (mock)|
                                                     | - Loans Hub                  |
                                                     | - Orbital AMM + Math Helper  |
                                                     +------------------------------+
```

Notes:
- All blockchain reads/writes go through wagmi/viem/ethers to Hedera EVM via Hashio RPC.
- No custom backend; state is primarily on-chain and in client state/query cache.

## 🔄 Data Flow (Key User Journeys)

```
+------------------+      +------------------------+      +---------------------+      +---------------------------+      +-----------------------------+
|      User        | ---> | Next.js Page (React UI)| ---> | Client Utilities    | ---> | wagmi/viem (Sign & Send)  | ---> | Hedera EVM (Chain ID 296)   |
| (Wallet: MM/WC)  |      | Forms, QR, toasts      |      | src/utils/*         |      | RPC: Hashio               |      | Contracts:                  |
|                  |      |                        |      | escrow, contract.ts |      | Wallet Provider           |      |  - ProtectedPay             |
+------------------+      +------------------------+      +---------------------+      +---------------------------+      |  - EscrowHub                |
                                                                                                                         |  - StableCoins (+ Oracle)   |
                                                                                                                         |  - Orbital AMM, Loans Hub   |
                                                                                                                         +-----------------------------+
                                                                                                                                                |
                                                                                                                                                | receipts + events / read data
                                                                                                                                                v
+------------------+      +------------------------+      +---------------------+      +---------------------------+      +-----------------------------+
| UI State Update  | <--- | React Query / Cache    | <--- | viem readContract   | <--- | RPC Provider (Hashio)     | <--- | Hedera EVM (Chain ID 296)   |
+------------------+      +------------------------+      +---------------------+      +---------------------------+      +-----------------------------+

Legend / Examples:
- Protected Transfer: sendProtectedTransfer / claimTransfer / refundTransfer  -> Hedera EVM -> ProtectedPay
- Escrow: createEscrow / confirmDelivery / refund / claimAfterExpiry         -> Hedera EVM -> EscrowHub
- StableCoins: mint / burn (oracle-admin gated)                              -> Hedera EVM -> StableCoins (+ Oracle)
- Orbital AMM: quote / swap / add/remove liquidity                           -> Hedera EVM -> Orbital Pool/Helper
```



## 🚀 How It Works


### Feature-specific Data Flow Diagrams

<details>
<summary>Protected Transfers (ProtectedPay)</summary>

```
+--------------------+  +---------------------------+  +------------------------+  +----------------------+  +-------------------------------------------+
| Sender (Wallet)    |->| Transfer UI (Next.js)     |->| contract.ts (send...)  |->| wagmi/viem (sign tx) |->| Hedera EVM (Chain 296): ProtectedPay      |
+--------------------+  +---------------------------+  +------------------------+  +----------------------+  +-------------------------------------------+
                                                                                                                            | events: TransferCreated/Claimed/Refunded
                                                                                                                            v
                                                                                                      viem readContract -> React Query cache -> UI update

+--------------------+  +---------------------------+  +------------------------+  +----------------------+  +-------------------------------------------+
| Recipient (Wallet) |->| Claim UI (Next.js)        |->| contract.ts (claim...) |->| wagmi/viem (sign tx) |->| Hedera EVM (Chain 296): ProtectedPay      |
+--------------------+  +---------------------------+  +------------------------+  +----------------------+  +-------------------------------------------+
```

</details>

<details>
<summary>Escrow (EscrowHub)</summary>

```
Create Escrow
+--------------------+  +---------------------------+  +-------------------------+  +----------------------+  +-------------------------------------------+
| Buyer (Wallet)     |->| Escrow UI (Next.js)       |->| escrow/client.ts (new)  |->| wagmi/viem (sign tx) |->| Hedera EVM (Chain 296): EscrowHub         |
+--------------------+  +---------------------------+  +-------------------------+  +----------------------+  +-------------------------------------------+
                                                                                                                            | locks funds, emits EscrowCreated
                                                                                                                            v
                                                                                                      viem readContract -> React Query cache -> UI update

Confirm Delivery
+--------------------+  +---------------------------+  +-------------------------+  +----------------------+  +-------------------------------------------+
| Buyer (Wallet)     |->| Escrow UI (Next.js)       |->| escrow/client.ts (ok)   |->| wagmi/viem (sign tx) |->| Hedera EVM (Chain 296): EscrowHub         |
+--------------------+  +---------------------------+  +-------------------------+  +----------------------+  +-------------------------------------------+
                                                                                                                            | releases to Seller, EscrowCompleted
                                                                                                                            v
                                                                                                      viem readContract -> React Query cache -> UI update

Claim After Expiry / Refund
+--------------------+  +---------------------------+  +-------------------------+  +----------------------+  +-------------------------------------------+
| Seller/Owner       |->| Escrow UI (Next.js)       |->| escrow/client.ts        |->| wagmi/viem (sign tx) |->| Hedera EVM (Chain 296): EscrowHub         |
+--------------------+  +---------------------------+  +-------------------------+  +----------------------+  +-------------------------------------------+
                                                                                                                            | payout Seller or refund Buyer
```

</details>

<details>
<summary>StableCoins (StableCoins + Oracle)</summary>

```
Mint / Burn (Admin-gated)
+--------------------+  +---------------------------+  +-------------------------------+  +----------------------+  +--------------------------------------------------+
| Admin (Wallet)     |->| StableCoins UI (Next.js)  |->| stablecoinsClient.ts (mint/..) |->| wagmi/viem (sign tx) |->| Hedera EVM (Chain 296): StableCoins (+ Oracle)   |
+--------------------+  +---------------------------+  +-------------------------------+  +----------------------+  +--------------------------------------------------+
                                                                                                                                    | updates supply, emits events
                                                                                                                                    v
                                                                                                              viem readContract -> React Query -> UI update

Transfer (Users)
+--------------------+  +---------------------------+  +-------------------------------+  +----------------------+  +--------------------------------------------------+
| User (Wallet)      |->| StableCoins UI (Next.js)  |->| erc20Client.ts (transfer)      |->| wagmi/viem (sign tx) |->| Hedera EVM (Chain 296): StableCoins (ERC-20)     |
+--------------------+  +---------------------------+  +-------------------------------+  +----------------------+  +--------------------------------------------------+
```

</details>

<details>
<summary>Orbital AMM (Orbital Pool / Helper)</summary>

```
Quote (Read)
+--------------------+  +---------------------------+  +---------------------------+  +---------------------------+  +----------------------------------------------+
| Trader (Wallet)    |->| Exchange UI (Next.js)     |->| orbital/client.ts (quote) |->| viem readContract (RPC)   |->| Hedera EVM (Chain 296): Orbital Pool/Helper  |
+--------------------+  +---------------------------+  +---------------------------+  +---------------------------+  +----------------------------------------------+
                                                                                                                       | returns quote, pool/reserves state
                                                                                                                       v
                                                                                                   UI displays price impact, route, fees

Swap / Liquidity (Write)
+--------------------+  +---------------------------+  +---------------------------+  +----------------------+  +----------------------------------------------+
| Trader (Wallet)    |->| Exchange UI (Next.js)     |->| orbital/client.ts (swap)  |->| wagmi/viem (sign tx) |->| Hedera EVM (Chain 296): Orbital Pool/Helper  |
+--------------------+  +---------------------------+  +---------------------------+  +----------------------+  +----------------------------------------------+
                                                                                                                       | updates pool, mints/burns LP, emits events
                                                                                                                       v
                                                                                                   viem readContract -> React Query -> UI update
```


## How to Run Locally
Prerequisites:
- Node.js 18+ (LTS recommended)
- A wallet (e.g., MetaMask) configured for Hedera Testnet (EVM, chainId 296)
- Optional: Hedera Testnet HBAR for gas (testnet faucet)

Steps:
1) Install dependencies
- At repo root: `npm ci`
- Contracts workspace: `npm run contracts:install`

2) Configure environment (optional, see next section)
- Create `.env.local` in repo root and set any contract addresses you need

3) Start the app (dev)
- `npm run dev`
- Open http://localhost:3000

4) Production build
- `npm run build` then `npm start`

5) Use the app
- Click "Launch App" → /dashboard
- Connect your wallet (bottom left controls)
- Navigate via left sidebar (Transfers, Group Payments, Savings, StableCoins, Exchange, Orbital Pool, Loans, History)

---

## Configuration (.env)
Create a `.env.local` at the repo root to wire contracts:

Core ProtectedPay contract (Hedera Testnet):
- `NEXT_PUBLIC_CONTRACT_ADDRESS_296=0x...`  (ProtectedPay.sol deployment)

StableCoins + USDC (optional, enables on-chain mint/burn):
- `NEXT_PUBLIC_STABLECOINS_ADDRESS_296=0x...`
- `NEXT_PUBLIC_USDC_ADDRESS_296=0x...`  (or legacy `NEXT_PUBLIC_USDT_ADDRESS_296`)

Orbital AMM (optional):
- `NEXT_PUBLIC_ORBITAL_POOL_ADDRESS_296=0x...`
- `NEXT_PUBLIC_ORBITAL_HELPER_ADDRESS_296=0x...` (if applicable)
- `NEXT_PUBLIC_ORBITAL_TOKENS_296=0xTokenUSDC,0xTokenZAR,0xTokenNGN,0xTokenKES,0xTokenUGX`

Escrow Hub (optional):
- `NEXT_PUBLIC_ESCROW_HUB_ADDRESS_296=0x...`


Notes:
- If variables above are unset, related pages will gracefully degrade (e.g., StableCoins page uses local mock ledger + oracle preview).


---

## Deployed Contracts (Hedera Testnet)

| Contract | Address | HashScan |
|---|---|---|
| ProtectedPay | `0x31E2462C911B25E187a4BaA1b01C85130e9b96Ab` | https://hashscan.io/testnet/address/0x31E2462C911B25E187a4BaA1b01C85130e9b96Ab |
| EscrowHub | `0x947D18f7291D52654DD74E89278653d7b50a13d3` | https://hashscan.io/testnet/address/0x947D18f7291D52654DD74E89278653d7b50a13d3 |
| StableCoins | `0x620f832098Ab242C76d1e7f54b72D7516bB81cd8` | https://hashscan.io/testnet/address/0x620f832098Ab242C76d1e7f54b72D7516bB81cd8 |
| StableCoins Oracle | `0x3A5b28A4184550Da0A7D790e2E07A0Db58fEE2aa` | https://hashscan.io/testnet/address/0x3A5b28A4184550Da0A7D790e2E07A0Db58fEE2aa |
| USDC (ERC-20) | `0x25c4208b3A142C7B0300036EAbE1F8ec727D0587` | https://hashscan.io/testnet/address/0x25c4208b3A142C7B0300036EAbE1F8ec727D0587 |
| HBAR ERC-20 (Wrapped HBAR) | `0xd1961bB0F309244810D937aEb7F9b41Fae5Bc7fE` | https://hashscan.io/testnet/address/0xd1961bB0F309244810D937aEb7F9b41Fae5Bc7fE |
| Loans Hub | `0x3e6eF0f42d4B5B9E478eC21a1e29C65E275b3600` | https://hashscan.io/testnet/address/0x3e6eF0f42d4B5B9E478eC21a1e29C65E275b3600 |
| Orbital Pool | `0xc59bb518F1CF33129E475Cd64dE7a59454CF7e66` | https://hashscan.io/testnet/address/0xc59bb518F1CF33129E475Cd64dE7a59454CF7e66 |
| Orbital Helper | `0x177Fce1a31A954751844c2f3b87FF9392733C8bf` | https://hashscan.io/testnet/address/0x177Fce1a31A954751844c2f3b87FF9392733C8bf |
| Orbital Token USDC (mock) | `0x1fA51FA08FB6075CB9f316a5A68D4432424A4C4d` | https://hashscan.io/testnet/address/0x1fA51FA08FB6075CB9f316a5A68D4432424A4C4d |
| Orbital Token ZAR | `0x6DF4f1Da885C2b3baCbCBD01f9690Bcc326431e1` | https://hashscan.io/testnet/address/0x6DF4f1Da885C2b3baCbCBD01f9690Bcc326431e1 |
| Orbital Token NGN | `0x6e3BC780BE7137476F39d7d5A5D2c0271677ee3C` | https://hashscan.io/testnet/address/0x6e3BC780BE7137476F39d7d5A5D2c0271677ee3C |
| Orbital Token KES | `0x176E5a68b3d6add658ca9205Ba28068b06dC93F5` | https://hashscan.io/testnet/address/0x176E5a68b3d6add658ca9205Ba28068b06dC93F5 |
| Orbital Token UGX | `0x63dDC591f30010d46Fe97FF96F0E836e9ED3c3D4` | https://hashscan.io/testnet/address/0x63dDC591f30010d46Fe97FF96F0E836e9ED3c3D4 |

---

## Smart Contracts (Hardhat)
Location: `contracts/`

Install/build:
- `npm install`
- `npm run build`

Network: Hedera Testnet (EVM) via Hardhat network `hederaTestnet` (see `contracts/hardhat.config.js`).

Environment for deploy (contracts/.env):
- `HEDERA_TESTNET_RPC_URL=...`
- `DEPLOYER_PRIVATE_KEY=...`

Deploy scripts:
- ProtectedPay: `npm run deploy:hedera`
- Orbital (pool/helper): `npm run deploy:orbital:hedera`
- StableCoins: `npm run deploy:stablecoins:hedera` (or pro: `deploy:stablecoins:pro:hedera`)
- Mock USDC + mint helper: `deploy:mockusdc:hedera`, `mint:usdc:hedera`
- Verify/smoke: `verify:hedera`, `smoke:hedera`, `test:hedera`

Post-deploy:
- Copy emitted addresses into repo root `.env.local` per the Configuration section

---

## Useful Commands
Frontend (root):
- `npm ci` — install dependencies
- `npm run dev` — start Next.js in dev
- `npm run build && npm start` — production build & serve
- `npm run lint` — linting

Contracts:
- `npm run contracts:install` — install deps in contracts/
- `npm run contracts:build` — compile solidity
- `npm run contracts:deploy` — deploy ProtectedPay on Hedera Testnet
- See contracts/package.json for more deploy utilities

---

## Notes, Disclaimers, and Roadmap
- Testnet only: default network is Hedera Testnet (chainId 296). Do not use with mainnet funds.
- StableCoins page: mock oracle is for UX/demo; on-chain mint/burn requires deploying StableCoins + USDC and setting env vars.
- Loans page: UI prototype only — buttons are disabled until lending/borrowing contracts and flows are integrated.
- Orbital AMM: experimental math/model; ensure addresses are configured before attempting real swaps/liquidity.



