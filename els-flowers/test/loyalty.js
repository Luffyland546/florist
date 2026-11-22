const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Blooming Flower", () => {
  it("rewards Roses and unlocks tiers", async () => {
    const [owner, alice] = await ethers.getSigners();
    const rose = await (await ethers.getContractFactory("RoseToken")).deploy();
    const nft = await (await ethers.getContractFactory("BloomingFlowerNFT")).deploy(await rose.getAddress());
    await nft.setTierURI(1, "ipfs://daisy");
    await expect(rose.rewardPurchase(alice.address, 24)).to.be.revertedWith("Spend at least 25 EUR");
    await rose.rewardPurchase(alice.address, 75);
    expect(await rose.balanceOf(alice.address)).to.equal(3);
    await expect(nft.connect(alice).claimTier(1)).to.be.revertedWith("Not enough Roses earned");
    await rose.rewardPurchase(alice.address, 25000);
    await nft.connect(alice).claimTier(1);
    expect(await nft.ownerOf(1)).to.equal(alice.address);
    expect(await nft.myDiscount(alice.address)).to.equal(10);
    await rose.connect(alice).redeem(500); // tier progress unaffected
    expect(await rose.lifetimeEarned(alice.address)).to.equal(1003);
  });
});
