const hre = require("hardhat");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retry when the node says "in-flight transaction limit" (happens with EIP-7702 / smart-account wallets)
async function retry(label, fn) {
  for (let i = 1; i <= 12; i++) {
    try { return await fn(); }
    catch (e) {
      const msg = String(e.message || e);
      if (!/in-flight|pending|nonce|replacement|already known/i.test(msg) || i === 12) throw e;
      console.log(`${label}: node busy, retrying in 8s (${i}/12)...`);
      await sleep(8000);
    }
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const rose = await retry("deploy Rose", async () => {
    const c = await (await hre.ethers.getContractFactory("RoseToken")).deploy();
    await c.deploymentTransaction().wait(1);
    return c;
  });
  console.log("RoseToken:", await rose.getAddress());
  await sleep(6000);

  const nft = await retry("deploy NFT", async () => {
    const c = await (await hre.ethers.getContractFactory("BloomingFlowerNFT")).deploy(await rose.getAddress());
    await c.deploymentTransaction().wait(1);
    return c;
  });
  console.log("BloomingFlowerNFT:", await nft.getAddress());

  // Save addresses NOW so they are never lost, even if a later step fails
  const chainId = String((await hre.ethers.provider.getNetwork()).chainId);
  const file = "public/deployments.json";
  const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
  all[chainId] = { rose: await rose.getAddress(), nft: await nft.getAddress(), owner: deployer.address };
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
  console.log("Saved to public/deployments.json for chain", chainId);

  if (fs.existsSync("public/nft/tier-uris.json")) {
    const uris = JSON.parse(fs.readFileSync("public/nft/tier-uris.json"));
    for (const t of [1, 2, 3]) {
      await sleep(6000);
      await retry("setTierURI " + t, async () => (await nft.setTierURI(t, uris[t])).wait(1));
      console.log("Tier", t, "metadata set");
    }
  } else console.log("No tier-uris.json yet: run `npm run pinata` first, then redeploy.");
  console.log("DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });