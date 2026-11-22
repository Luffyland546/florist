const hre = require("hardhat");
const fs = require("fs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function retry(label, fn) {
  for (let i = 1; i <= 12; i++) {
    try { return await fn(); }
    catch (e) {
      if (!/in-flight|pending|nonce|replacement|already known/i.test(String(e.message || e)) || i === 12) throw e;
      console.log(`${label}: node busy, retrying in 8s (${i}/12)...`); await sleep(8000);
    }
  }
}
async function main() {
  const chainId = String((await hre.ethers.provider.getNetwork()).chainId);
  const file = "public/deployments.json";
  const all = JSON.parse(fs.readFileSync(file));
  const d = all[chainId];
  if (!d) throw new Error("No existing deployment for chain " + chainId + ". Run the normal deploy first.");
  const uris = JSON.parse(fs.readFileSync("public/nft/tier-uris.json"));
  const nft = await retry("deploy NFT", async () => {
    const c = await (await hre.ethers.getContractFactory("BloomingFlowerNFT")).deploy(d.rose);
    await c.deploymentTransaction().wait(1);
    return c;
  });
  d.nft = await nft.getAddress();
  all[chainId] = d;
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
  console.log("New NFT contract:", d.nft, "(Rose token unchanged:", d.rose + ")");
  for (const t of [1, 2, 3]) {
    await sleep(6000);
    await retry("setTierURI " + t, async () => (await nft.setTierURI(t, uris[t])).wait(1));
    console.log("Tier", t, "->", uris[t]);
  }
  console.log("DONE");
}
main().catch((e) => { console.error(e); process.exit(1); });