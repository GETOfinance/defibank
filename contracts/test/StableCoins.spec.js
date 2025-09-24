const { expect } = require("chai");
const { ethers } = require("hardhat");

function b32(s) { return ethers.encodeBytes32String(s) }
function u6(n) { return ethers.parseUnits(n, 6) }
function u18(n) { return ethers.parseUnits(n, 18) }

describe("StableCoins", function () {
  it("anyone can mint with USDC and burn to redeem USDC", async () => {
    const [owner, alice] = await ethers.getSigners()

    // Deploy mocks
    const USDC = await ethers.getContractFactory("MockUSDC6")
    const usdc = await USDC.deploy(owner.address)
    await usdc.waitForDeployment()
    const usdcAddress = await usdc.getAddress()

    const Oracle = await ethers.getContractFactory("MockStableOracle")
    const oracle = await Oracle.deploy(owner.address)
    await oracle.waitForDeployment()
    await (await oracle.setPrice(b32('NGN'), u18('1600'))).wait() // 1 USDC = 1600 NGN

    const Stable = await ethers.getContractFactory("StableCoins")
    const stable = await Stable.deploy(owner.address, usdcAddress, await oracle.getAddress(), [b32('NGN')])
    await stable.waitForDeployment()
    const stableAddress = await stable.getAddress()

    // Fund Alice with USDC and approve
    await (await usdc.mint(alice.address, u6('100'))).wait()
    const stableAsAlice = stable.connect(alice)
    await (await usdc.connect(alice).approve(stableAddress, u6('100'))).wait()

    // Mint 16000 NGN (requires 10 USDC)
    await (await stableAsAlice.mint(b32('NGN'), u6('16000'))).wait()

    // Check balances and reserves/liabilities
    expect(await stable.balanceOf(alice.address, b32('NGN'))).to.eq(u6('16000'))
    expect(await stable.liabilitiesUSDC(b32('NGN'))).to.eq(u6('10'))
    expect(await stable.reservesUSDC(b32('NGN'))).to.eq(u6('10'))
    expect(await usdc.balanceOf(stableAddress)).to.eq(u6('10'))

    // Burn 8000 NGN (redeems 5 USDC)
    await (await stableAsAlice.burn(b32('NGN'), u6('8000'))).wait()

    expect(await stable.balanceOf(alice.address, b32('NGN'))).to.eq(u6('8000'))
    expect(await stable.liabilitiesUSDC(b32('NGN'))).to.eq(u6('5'))
    expect(await stable.reservesUSDC(b32('NGN'))).to.eq(u6('5'))
    expect(await usdc.balanceOf(alice.address)).to.eq(u6('95'))
  })

  it("reverts on insufficient allowance or balance for mint", async () => {
    const [owner, alice] = await ethers.getSigners()
    const USDC = await ethers.getContractFactory("MockUSDC6")
    const usdc = await USDC.deploy(owner.address)
    await usdc.waitForDeployment()
    const Oracle = await ethers.getContractFactory("MockStableOracle")
    const oracle = await Oracle.deploy(owner.address)
    await oracle.waitForDeployment()
    await (await oracle.setPrice(b32('NGN'), u18('1600'))).wait()
    const Stable = await ethers.getContractFactory("StableCoins")
    const stable = await Stable.deploy(owner.address, await usdc.getAddress(), await oracle.getAddress(), [b32('NGN')])
    await stable.waitForDeployment()

    // Alice has 100 USDC but approves only 5
    await (await usdc.mint(alice.address, u6('100'))).wait()
    await (await usdc.connect(alice).approve(await stable.getAddress(), u6('5'))).wait()

    await expect(stable.connect(alice).mint(b32('NGN'), u6('16000')))
      .to.be.reverted

    // Alice approves 100 but has only 1 USDC
    const bob = (await ethers.getSigners())[2]
    await (await usdc.mint(bob.address, u6('1'))).wait()
    await (await usdc.connect(bob).approve(await stable.getAddress(), u6('100'))).wait()
    await expect(stable.connect(bob).mint(b32('NGN'), u6('16000')))
      .to.be.reverted
  })

  it("reverts when oracle price is zero or unset", async () => {
    const [owner, alice] = await ethers.getSigners()
    const USDC = await ethers.getContractFactory("MockUSDC6")
    const usdc = await USDC.deploy(owner.address)
    await usdc.waitForDeployment()
    const Oracle = await ethers.getContractFactory("MockStableOracle")
    const oracle = await Oracle.deploy(owner.address)
    await oracle.waitForDeployment()
    // No price set for KES => 0
    const Stable = await ethers.getContractFactory("StableCoins")
    const stable = await Stable.deploy(owner.address, await usdc.getAddress(), await oracle.getAddress(), [b32('KES')])
    await stable.waitForDeployment()

    await (await usdc.mint(alice.address, u6('100'))).wait()
    await (await usdc.connect(alice).approve(await stable.getAddress(), u6('100'))).wait()

    await expect(stable.connect(alice).mint(b32('KES'), u6('1300')))
      .to.be.revertedWith("oracle")
  })

  it("owner reserve management enforces onlyOwner and excess constraints", async () => {
    const [owner, alice] = await ethers.getSigners()
    const USDC = await ethers.getContractFactory("MockUSDC6")
    const usdc = await USDC.deploy(owner.address)
    await usdc.waitForDeployment()
    const Oracle = await ethers.getContractFactory("MockStableOracle")
    const oracle = await Oracle.deploy(owner.address)
    await oracle.waitForDeployment()
    await (await oracle.setPrice(b32('NGN'), u18('1600'))).wait()
    const Stable = await ethers.getContractFactory("StableCoins")
    const stable = await Stable.deploy(owner.address, await usdc.getAddress(), await oracle.getAddress(), [b32('NGN')])
    await stable.waitForDeployment()

    // Non-owner cannot fundReserves
    await expect(stable.connect(alice).fundReserves(b32('NGN'), u6('10'))).to.be.reverted

    // Owner funds reserves: must approve transferFrom
    await (await usdc.mint(owner.address, u6('200'))).wait()
    await (await usdc.approve(await stable.getAddress(), u6('200'))).wait()
    await (await stable.fundReserves(b32('NGN'), u6('100'))).wait()
    expect(await stable.reservesUSDC(b32('NGN'))).to.eq(u6('100'))

    // Alice mints 16000 NGN => liabilities 10, reserves +10
    await (await usdc.mint(alice.address, u6('100'))).wait()
    await (await usdc.connect(alice).approve(await stable.getAddress(), u6('100'))).wait()
    await (await stable.connect(alice).mint(b32('NGN'), u6('16000'))).wait()

    expect(await stable.reservesUSDC(b32('NGN'))).to.eq(u6('110'))
    expect(await stable.liabilitiesUSDC(b32('NGN'))).to.eq(u6('10'))

    // Withdraw more than excess (110-10=100) should revert
    await expect(stable.withdrawExcess(b32('NGN'), owner.address, u6('101'))).to.be.revertedWith("exceeds excess")

    // Withdraw with zero address should revert
    await expect(stable.withdrawExcess(b32('NGN'), ethers.ZeroAddress, u6('1'))).to.be.revertedWith("to=0")

    // Valid withdraw 100
    await (await stable.withdrawExcess(b32('NGN'), owner.address, u6('100'))).wait()
    expect(await stable.reservesUSDC(b32('NGN'))).to.eq(u6('10'))
    expect(await usdc.balanceOf(owner.address)).to.eq(u6('200'))
  })

  it("tracks multiple currencies independently", async () => {
    const [owner, alice] = await ethers.getSigners()
    const USDC = await ethers.getContractFactory("MockUSDC6")
    const usdc = await USDC.deploy(owner.address)
    await usdc.waitForDeployment()
    const Oracle = await ethers.getContractFactory("MockStableOracle")
    const oracle = await Oracle.deploy(owner.address)
    await oracle.waitForDeployment()
    await (await oracle.setPrice(b32('NGN'), u18('1600'))).wait()
    await (await oracle.setPrice(b32('KES'), u18('130'))).wait()

    const Stable = await ethers.getContractFactory("StableCoins")
    const stable = await Stable.deploy(owner.address, await usdc.getAddress(), await oracle.getAddress(), [b32('NGN'), b32('KES')])
    await stable.waitForDeployment()
    const addr = await stable.getAddress()

    await (await usdc.mint(alice.address, u6('100'))).wait()
    await (await usdc.connect(alice).approve(addr, u6('100'))).wait()

    // Mint 16000 NGN (10 USDC) and 1300 KES (10 USDC)
    await (await stable.connect(alice).mint(b32('NGN'), u6('16000'))).wait()
    await (await stable.connect(alice).mint(b32('KES'), u6('1300'))).wait()

    expect(await stable.balanceOf(alice.address, b32('NGN'))).to.eq(u6('16000'))
    expect(await stable.balanceOf(alice.address, b32('KES'))).to.eq(u6('1300'))
    expect(await stable.liabilitiesUSDC(b32('NGN'))).to.eq(u6('10'))
    expect(await stable.liabilitiesUSDC(b32('KES'))).to.eq(u6('10'))

    // Burn 1600 NGN (1 USDC). KES should remain unchanged
    await (await stable.connect(alice).burn(b32('NGN'), u6('1600'))).wait()

    expect(await stable.liabilitiesUSDC(b32('NGN'))).to.eq(u6('9'))
    expect(await stable.reservesUSDC(b32('NGN'))).to.eq(u6('9'))
    expect(await stable.liabilitiesUSDC(b32('KES'))).to.eq(u6('10'))
    expect(await stable.reservesUSDC(b32('KES'))).to.eq(u6('10'))
  })
})

