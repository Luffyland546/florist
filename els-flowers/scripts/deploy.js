const hre = require("hardhat");
const fs = require("fs");
async function main() {
  const rose = await (await hre.ethers.getContractFactory("RoseToken")).deploy();
  await rose.waitForDeployment();
  const nft = await (await hre.ethers.getContractFactory("BloomingFlowerNFT")).deploy(await rose.getAddress());
  await nft.waitForDeployment();
  // Set tier metadata if scripts/uploadToPinata.js has been run
  if (fs.existsSync("public/nft/tier-uris.json")) {
    const uris = JSON.parse(fs.readFileSync("public/nft/tier-uris.json"));
    for (const t of [1, 2, 3]) await (await nft.setTierURI(t, uris[t])).wait();
  } else console.log("No tier-uris.json yet: run `npm run pinata`, then call setTierURI (or redeploy).");
  const chainId = String((await hre.ethers.provider.getNetwork()).chainId);
  const file = "public/deployments.json";
  const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
  all[chainId] = { rose: await rose.getAddress(), nft: await nft.getAddress(), owner: (await hre.ethers.getSigners())[0].address };
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
  console.log("Deployed on chain", chainId, all[chainId]);
}
main().catch((e) => { console.error(e); process.exit(1); });
