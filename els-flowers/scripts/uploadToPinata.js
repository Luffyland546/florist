// Uploads the 3 tier images + metadata JSON to IPFS via Pinata. Needs PINATA_JWT in .env
require("dotenv").config();
const fs = require("fs");
const JWT = process.env.PINATA_JWT;
if (!JWT) throw new Error("Set PINATA_JWT in .env");
const tiers = { 1: ["Daisy", "Bronze", "10% discount on purchases"], 2: ["Peony", "Silver", "15% discount + bouquet-making classes at home"], 3: ["Orchid", "Gold", "20% discount + plant care & decorating workshops"] };
async function pinFile(path, name) {
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(path)], { type: "image/jpeg" }), name);
  const r = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", { method: "POST", headers: { Authorization: `Bearer ${JWT}` }, body: form });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).IpfsHash;
}
async function pinJSON(obj, name) {
  const r = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", { method: "POST", headers: { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" }, body: JSON.stringify({ pinataContent: obj, pinataMetadata: { name } }) });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).IpfsHash;
}
(async () => {
  const out = {};
  for (const [id, [flower, tier, perk]] of Object.entries(tiers)) {
    const img = await pinFile(`public/nft/${flower.toLowerCase()}.jpg`, `${flower}.jpg`);
    const cid = await pinJSON({ name: `${flower} - ${tier} Tier`, description: `Blooming Flower by El's Flowers & Gifts. ${perk}.`, image: `ipfs://${img}`, attributes: [{ trait_type: "Tier", value: tier }, { trait_type: "Discount/Perk", value: perk }] }, `${flower}.json`);
    out[id] = `ipfs://${cid}`;
    console.log(flower, out[id]);
  }
  fs.writeFileSync("public/nft/tier-uris.json", JSON.stringify(out, null, 2));
})();
