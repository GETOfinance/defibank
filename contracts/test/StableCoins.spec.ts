import { expect } from "chai";
import { ethers } from "hardhat";

function b32(s: string) { return ethers.utils.formatBytes32String(s) }
function u6(n: string) { return ethers.utils.parseUnits(n, 6) }
function u18(n: string) { return ethers.utils.parseUnits(n, 18) }

describe("StableCoins", function () {
  it("anyone can mint with USDC and burn to redeem USDC", async () => {
    const [owner, alice] = await ethers.getSigners()

    // Deploy mocks
    const USDC = await ethers.getContractFactory("MockUSDC6")
    const usdc = await USDC.deploy(owner.address)
    await usdc.deployed()

    const Oracle = await ethers.getContractFactory("MockStableOracle")
    const oracle = await Oracle.deploy(owner.address)
    await oracle.deployed()
    await (await oracle.setPrice(b32('NGN'), u18('1600'))).wait() // 1 USDC = 1600 NGN

    const Stable = await ethers.getContractFactory("StableCoins")
    const stable = await Stable.deploy(owner.address, usdc.address, oracle.address, [b32('NGN')])
    await stable.deployed()

    // Fund Alice with USDC and approve
    await (await usdc.mint(alice.address, u6('100'))).wait()
    const stableAsAlice = stable.connect(alice)
    await (await usdc.connect(alice).approve(stable.address, u6('100'))).wait()

    // Mint 16000 NGN (requires 10 USDC)
    await (await stableAsAlice.mint(b32('NGN'), u6('16000'))).wait()

    // Check balances and reserves/liabilities
    expect(await stable.balanceOf(alice.address, b32('NGN'))).to.eq(u6('16000'))
    expect(await stable.liabilitiesUSDC(b32('NGN'))).to.eq(u6('10'))
    expect(await stable.reservesUSDC(b32('NGN'))).to.eq(u6('10'))
    expect(await usdc.balanceOf(stable.address)).to.eq(u6('10'))

    // Burn 8000 NGN (redeems 5 USDC)
    await (await stableAsAlice.burn(b32('NGN'), u6('8000'))).wait()

    expect(await stable.balanceOf(alice.address, b32('NGN'))).to.eq(u6('8000'))
    expect(await stable.liabilitiesUSDC(b32('NGN'))).to.eq(u6('5'))
    expect(await stable.reservesUSDC(b32('NGN'))).to.eq(u6('5'))
    expect(await usdc.balanceOf(alice.address)).to.eq(u6('95'))
  })
})

