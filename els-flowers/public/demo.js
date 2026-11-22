// DEMO MODE: fake wallet + fake contracts so you can preview the UI without Ganache/MetaMask.
// Locally: http://localhost:3000/?demo   (real mode ignores this file)
window.makeDemo = () => {
  const me = "0xE1sF10wers000000000000000000000000De m0".replace(/\s/g, "");
  const s = { bal: 1200, life: 1200, tier: 0, nfts: [] };               // <- edit starting Roses here
  const tx = async (fn) => { fn(); return { wait: async () => {} }; };
  const meta = (name, img) => "data:application/json," + encodeURIComponent(JSON.stringify({ name, image: img }));
  const art = { 1: ["Daisy · Bronze Tier", "nft/daisy.jpg"], 2: ["Peony · Silver Tier", "nft/peony.jpg"], 3: ["Orchid · Gold Tier", "nft/orchid.jpg"] };
  const rose = {
    balanceOf: async () => s.bal, lifetimeEarned: async () => s.life, owner: async () => me,
    redeem: (n) => tx(() => { s.bal -= Number(n); }),
    transfer: (to, n) => tx(() => { s.bal -= Number(n); }),
    rewardPurchase: (to, e) => tx(() => { const r = Math.floor(e / 25); if (!r) throw new Error("Spend at least 25 EUR"); s.bal += r; s.life += r; }),
  };
  const nft = {
    tierOf: async () => s.tier, myDiscount: async () => [0, 10, 15, 20][s.tier], nextId: async () => s.nfts.length + 1,
    ownerOf: async () => me, kindOf: async (i) => s.nfts[i - 1].kind, tokenURI: async (i) => s.nfts[i - 1].uri,
    claimTier: (t) => tx(() => { s.tier = t; s.nfts.push({ kind: art[t][0].split(" ")[0], uri: meta(art[t][0], art[t][1]) }); }),
    mintOccasion: (to, uri) => tx(() => s.nfts.push({ kind: "Occasion", uri: meta("Wedding Occasion NFT", "nft/peony.jpg") })),
  };
  return { me, rose, nft };
};
