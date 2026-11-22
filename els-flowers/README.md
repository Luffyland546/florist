# El's Flowers & Gifts – Blooming Flower DApp
ERC-20 **Rose** token + ERC-721 **Daisy / Peony / Orchid** NFTs + wedding occasion NFTs. Stack: Hardhat, Ganache, MetaMask, Sepolia, Pinata, GitHub, Netlify.

## Folder map (where to edit)
| What | File |
|---|---|
| Colours / fonts / hero | `public/style.css` (`:root` block) |
| Page text & layout | `public/index.html` |
| Products, tier names & perks | `public/app.js` (`PRODUCTS`, `TIERS`) |
| Tier thresholds (on-chain) | `contracts/BloomingFlowerNFT.sol` (`threshold`) |
| NFT images | `public/nft/*.jpg` |
| Hero photo | `public/img/rose.jpg` |
| Contract addresses | `public/deployments.json` (written by deploy script) |

## STEP 0 – Preview with no blockchain
`npm install` then `npm start` and open http://localhost:3000/?demo

## STEP 1 – Install tools
Node.js 18+ (nodejs.org), VS Code, Git, MetaMask browser extension, Ganache (GUI), a free GitHub and Netlify account.

## STEP 2 – Local blockchain (Ganache)
1. Open Ganache -> **New Workspace (Ethereum)** -> Save. RPC is `http://127.0.0.1:7545`.
2. Click the key icon next to account #1, copy the **private key**. Put it in `.env` as `GANACHE_PRIVATE_KEY=` (copy `.env.example` to `.env` first).
3. MetaMask -> Networks -> Add network manually: Name `Ganache`, RPC `http://127.0.0.1:7545`, Chain ID `1337`, Symbol `ETH`.
4. MetaMask -> Add account -> Import: paste account #1 private key (this is the **shop owner**). Import account #2 as a **customer**.

## STEP 3 – Pinata (NFT images)
1. app.pinata.cloud -> API Keys -> New Key (admin) -> copy the **JWT** into `.env` as `PINATA_JWT=`.
2. `npm run pinata` -> uploads the 3 photos + metadata, creates `public/nft/tier-uris.json`.

## STEP 4 – Test, deploy, run locally
```
npm test
npm run deploy:ganache
npm start
```
Open http://localhost:3000, MetaMask on Ganache, owner account: Staff panel appears. Staff: reward customer wallet with e.g. 25000 euros -> 1000 Roses -> customer claims Daisy NFT. (For quick demos set `threshold` to `[0, 10, 50, 100]` in the contract and `at:` values in `TIERS`, then redeploy.)
If you redeploy, addresses in `deployments.json` update automatically.

## STEP 5 – Sepolia (needed for the live site)
1. Make a NEW throwaway MetaMask wallet. Get Sepolia ETH from a faucet (e.g. Google Cloud Web3 faucet / Alchemy faucet).
2. Create a free Alchemy or Infura app (Sepolia) -> copy RPC URL into `.env` `SEPOLIA_RPC_URL=`. Export that wallet's private key into `PRIVATE_KEY=`.
3. `npm run deploy:sepolia` (run `npm run pinata` first). Check `public/deployments.json` now has `11155111`.

## STEP 6 – GitHub
```
git init
git add .
git commit -m "El's Flowers DApp"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/els-flowers-dapp.git
git push -u origin main
```
(Create the empty repo on github.com first. `.env` is git-ignored - never upload it.)

## STEP 7 – Netlify
1. app.netlify.com -> Add new site -> Import an existing project -> GitHub -> pick the repo.
2. Build command: *leave empty*. Publish directory: `public`. Deploy.
3. Open the Netlify URL, MetaMask -> **Sepolia**, connect. Done.
4. Any change later: `git add . && git commit -m "update" && git push` redeploys automatically.

## Troubleshooting
- "No deployment on this network": MetaMask chain differs from `deployments.json` (Ganache 1337 / Sepolia 11155111).
- MetaMask nonce errors after restarting Ganache: Settings -> Advanced -> Clear activity tab data.
- Compiler errors in Remix: use 0.8.24 and EVM version **paris**.
- Staff panel missing: connect with the account that deployed the contracts.
