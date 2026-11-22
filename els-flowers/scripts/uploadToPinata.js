// 1) Writes NFT metadata JSON files into public/nft/metadata/ (served over https by Netlify, so MetaMask can load them)
// 2) Writes public/nft/tier-uris.json (what the deploy scripts put on the contract)
// 3) If PINATA_JWT is set, also pins each image to IPFS via Pinata as a backup (public/nft/pinata-cids.json)
require("dotenv").config();
const fs = require("fs");
const SITE = (process.env.SITE_URL || "https://florist-sheraz.netlify.app").replace(/\/$/, "");
const JWT = process.env.PINATA_JWT;
const tiers = {
  1: ["Daisy", "Bronze", "10% discount on purchases"],
  2: ["Peony", "Silver", "15% discount + bouquet-making classes at home"],
  3: ["Orchid", "Gold", "20% discount + plant care & decorating workshops"],
};
async function pinFile(path, name) {
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(path)], { type: "image/jpeg" }), name);
  const r = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", { method: "POST", headers: { Authorization: `Bearer ${JWT}` }, body: form });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).IpfsHash;
}
(async () => {
  fs.mkdirSync("public/nft/metadata", { recursive: true });
  const uris = {}, cids = {};
  for (const [id, [flower, tier, perk]] of Object.entries(tiers)) {
    const key = flower.toLowerCase();
    const meta = {
      name: `${flower} - ${tier} Tier`,
      description: `Blooming Flower by El's Flowers & Gifts. ${perk}.`,
      image: `${SITE}/nft/${key}.jpg`,
      attributes: [{ trait_type: "Tier", value: tier }, { trait_type: "Discount/Perk", value: perk }],
    };
    if (JWT) {
      try { const cid = await pinFile(`public/nft/${key}.jpg`, `${flower}.jpg`); meta.image_ipfs = `ipfs://${cid}`; cids[flower] = cid; console.log("Pinata:", flower, cid); }
      catch (e) { console.log("Pinata skipped for", flower, "-", String(e.message).slice(0, 120)); }
    }
    fs.writeFileSync(`public/nft/metadata/${key}.json`, JSON.stringify(meta, null, 2));
    uris[id] = `${SITE}/nft/metadata/${key}.json`;
  }
  fs.writeFileSync("public/nft/tier-uris.json", JSON.stringify(uris, null, 2));
  if (Object.keys(cids).length) fs.writeFileSync("public/nft/pinata-cids.json", JSON.stringify(cids, null, 2));
  console.log("Done. Token URIs:", uris);
})();