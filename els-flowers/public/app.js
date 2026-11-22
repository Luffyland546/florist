const ROSE_ABI=["function balanceOf(address) view returns(uint256)","function lifetimeEarned(address) view returns(uint256)","function transfer(address,uint256) returns(bool)","function redeem(uint256)","function rewardPurchase(address,uint256)","function owner() view returns(address)"];
const NFT_ABI=["function claimTier(uint8)","function tierOf(address) view returns(uint8)","function myDiscount(address) view returns(uint8)","function mintOccasion(address,string) returns(uint256)","function balanceOf(address) view returns(uint256)","function nextId() view returns(uint256)","function ownerOf(uint256) view returns(address)","function tokenURI(uint256) view returns(string)","function kindOf(uint256) view returns(string)"];
const TIERS=[{id:1,name:"Daisy",tier:"Bronze",at:1000,perk:"10% off every purchase",img:"nft/daisy.jpg"},{id:2,name:"Peony",tier:"Silver",at:5000,perk:"15% off + bouquet-making classes at home",img:"nft/peony.jpg"},{id:3,name:"Orchid",tier:"Gold",at:10000,perk:"20% off + plant care & decorating workshops",img:"nft/orchid.jpg"}];
const PRODUCTS=[["img/p1.jpg","Seasonal Bouquet",35],["img/p2.jpg","Bridal Bouquet",120],["img/p3.jpg","Dozen Red Roses",55],["img/p4.jpg","Bridesmaid Posy",30],["img/p5.jpg","Wedding Corsage",15],["img/p6.jpg","Potted Orchid",40]];
const NETS={1337:"Ganache (local)",11155111:"Sepolia testnet"};
const GATEWAYS=["https://gateway.pinata.cloud/ipfs/","https://ipfs.io/ipfs/","https://dweb.link/ipfs/","https://cloudflare-ipfs.com/ipfs/"];
const LOCAL={Daisy:"nft/daisy.jpg",Peony:"nft/peony.jpg",Orchid:"nft/orchid.jpg"};
let provider,signer,me,rose,nft,isOwner=false;
const DEMO=window.DEMO_MODE||location.search.includes("demo");
const LS="els_loggedout";
const flag={get:()=>{try{return localStorage.getItem(LS)}catch{return null}},set:v=>{try{v?localStorage.setItem(LS,"1"):localStorage.removeItem(LS)}catch{}}};
const $=id=>document.getElementById(id);
const toast=m=>{const t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),4200)};
const fmtErr=e=>e.reason||e.shortMessage||e.message||String(e);
const send=async(label,fn)=>{try{toast(label+"…");const tx=await fn();await tx.wait();toast("✅ "+label+" confirmed");await refresh()}catch(e){toast("⚠️ "+fmtErr(e))}};

// static UI
$("tierCards").innerHTML=TIERS.map(t=>`<div class="card tier"><img src="${t.img}" alt="${t.name}"><h3>${t.name} · ${t.tier}</h3><p>${t.perk}<br><small>${t.at.toLocaleString()} Roses earned</small></p><button class="btn" data-claim="${t.id}" disabled>Claim ${t.name} NFT</button></div>`).join("");
$("products").innerHTML=PRODUCTS.map(p=>`<div class="card prod"><div class="em"><img src="${p[0]}" alt="${p[1]}" loading="lazy"></div><h3>${p[1]}</h3><b>€${p[2]}</b><p class="muted">Earns ${Math.floor(p[2]/25)} Rose${p[2]>=50?"s":""}</p></div>`).join("");
const pe=document.querySelector(".petals");for(let i=0;i<14;i++){const s=document.createElement("i");s.textContent=["🌸","🌷","🌼"][i%3];s.style.cssText=`left:${Math.random()*100}%;font-size:${14+Math.random()*16}px;animation-duration:${9+Math.random()*10}s;animation-delay:-${Math.random()*12}s`;pe.appendChild(s)}

// ---- wallet: connect / switch account / log out ----
const switchBtn=document.createElement("button"),outBtn=document.createElement("button");
switchBtn.className=outBtn.className="btn ghost";switchBtn.textContent="Switch account";outBtn.textContent="Log out";
switchBtn.hidden=outBtn.hidden=true;switchBtn.style.marginLeft=outBtn.style.marginLeft="8px";
$("connect").after(switchBtn);switchBtn.after(outBtn);

function resetUI(){
  me=signer=rose=nft=null;isOwner=false;
  $("connect").textContent="Connect MetaMask";switchBtn.hidden=outBtn.hidden=true;
  $("net").textContent="Not connected";$("staff").hidden=$("staffLink").hidden=true;
  ["bal","life","disc"].forEach(i=>$(i).textContent="–");
  $("tierName").textContent="Connect wallet";$("barFill").style.width="0";
  $("barText").textContent="Connect your wallet to see progress.";
  $("myNfts").innerHTML='<p class="muted">Connect your wallet.</p>';
  document.querySelectorAll("[data-claim]").forEach(b=>b.disabled=true);
}

async function setup(){
  if(DEMO){const d=makeDemo();me=d.me;rose=d.rose;nft=d.nft;isOwner=true;
    $("net").textContent="DEMO MODE · simulated wallet (no blockchain)";
  }else{
    provider=new ethers.BrowserProvider(window.ethereum);   // fresh provider each time = no stale account/network
    signer=await provider.getSigner();me=await signer.getAddress();
    const chainId=Number((await provider.getNetwork()).chainId);
    $("net").textContent=(NETS[chainId]||"Unsupported network ("+chainId+")")+" · "+me.slice(0,8)+"…"+me.slice(-4);
    let dep;try{dep=(await (await fetch("deployments.json?"+Date.now())).json())[chainId]}catch{}
    if(!dep){rose=nft=null;isOwner=false;$("staff").hidden=$("staffLink").hidden=true;
      $("connect").textContent=me.slice(0,6)+"…"+me.slice(-4);switchBtn.hidden=outBtn.hidden=false;
      return toast("No deployment on this network. Switch MetaMask to Ganache (1337) or Sepolia.");}
    rose=new ethers.Contract(dep.rose,ROSE_ABI,signer);nft=new ethers.Contract(dep.nft,NFT_ABI,signer);
    isOwner=(await rose.owner()).toLowerCase()===me.toLowerCase();
  }
  $("connect").textContent=me.slice(0,6)+"…"+me.slice(-4);switchBtn.hidden=outBtn.hidden=false;
  $("staff").hidden=$("staffLink").hidden=!isOwner;
  await refresh();
}

async function connect(pickAccount){
  if(DEMO)return setup();
  if(!window.ethereum)return toast("Install MetaMask first: metamask.io");
  // wallet_requestPermissions opens MetaMask's account picker so you can choose a DIFFERENT account
  if(pickAccount){try{await window.ethereum.request({method:"wallet_requestPermissions",params:[{eth_accounts:{}}]})}catch(e){return toast("⚠️ "+fmtErr(e))}}
  await window.ethereum.request({method:"eth_requestAccounts"});
  flag.set(false);
  await setup();
}

async function logout(){
  try{await window.ethereum?.request({method:"wallet_revokePermissions",params:[{eth_accounts:{}}]})}catch{}
  flag.set(true);resetUI();toast("Logged out. Click Connect, or Switch account to pick another wallet.");
}

async function refresh(){
  if(!rose)return;
  const [bal,life,tier,disc]=await Promise.all([rose.balanceOf(me),rose.lifetimeEarned(me),nft.tierOf(me),nft.myDiscount(me)]);
  const L=Number(life);$("bal").textContent=bal;$("life").textContent=L;$("disc").textContent=disc+"%";
  $("tierName").textContent=tier>0?TIERS[tier-1].name+" · "+TIERS[tier-1].tier+" member":"No tier yet";
  const next=TIERS.find(t=>t.id>Number(tier));
  $("barFill").style.width=(next?Math.min(100,L/next.at*100):100)+"%";
  $("barText").textContent=next?`${L} / ${next.at.toLocaleString()} Roses to ${next.name} (${next.tier}) — about €${((next.at-L)*25).toLocaleString()} more to spend`:"You’ve reached the top tier 🌺";
  document.querySelectorAll("[data-claim]").forEach(b=>{const id=+b.dataset.claim;b.disabled=!(Number(tier)<id&&L>=TIERS[id-1].at);b.textContent=Number(tier)>=id?"Claimed ✓":"Claim "+TIERS[id-1].name+" NFT"});
  await loadNfts();
}

async function fetchIpfsJson(uri){
  if(!uri.startsWith("ipfs://"))return (await fetch(uri)).json();
  for(const g of GATEWAYS){try{const r=await fetch(g+uri.slice(7));if(r.ok)return await r.json()}catch{}}
  throw new Error("metadata unreachable");
}
async function loadNfts(){
  const n=Number(await nft.nextId()),out=[];
  for(let id=1;id<n;id++){try{
    if((await nft.ownerOf(id)).toLowerCase()!==me.toLowerCase())continue;
    const kind=await nft.kindOf(id);
    const meta=await fetchIpfsJson(await nft.tokenURI(id)).catch(()=>({name:kind+" NFT #"+id}));
    const remote=meta.image?(meta.image.startsWith("ipfs://")?GATEWAYS[0]+meta.image.slice(7):meta.image):"",local=LOCAL[kind]||"";
    out.push(`<div class="card tier"><img src="${remote||local}" alt="${meta.name||kind}" onerror="if(this.dataset.f)return;this.dataset.f=1;this.src='${local}'"><h3>${meta.name||kind}</h3><p>Token #${id} · ${kind}</p></div>`);
  }catch{}}
  $("myNfts").innerHTML=out.join("")||'<p class="muted">No NFTs yet — keep collecting Roses!</p>';
}

$("connect").onclick=()=>{if(me)return toast("Connected: "+me);connect(false).catch(e=>toast(fmtErr(e)))};
switchBtn.onclick=()=>connect(true).catch(e=>toast(fmtErr(e)));
outBtn.onclick=logout;
document.addEventListener("click",e=>{const id=e.target.dataset?.claim;if(id)send("Claiming NFT",()=>nft.claimTier(+id))});
$("redeemBtn").onclick=()=>send("Redeeming Roses",()=>rose.redeem($("redeemAmt").value));
$("sendBtn").onclick=()=>send("Gifting Roses",()=>rose.transfer($("sendTo").value,$("sendAmt").value));
$("rewardBtn").onclick=()=>send("Minting Roses",()=>rose.rewardPurchase($("cust").value,$("euros").value));
$("occBtn").onclick=()=>send("Minting occasion NFT",()=>nft.mintOccasion($("occTo").value,$("occUri").value));
if(window.ethereum&&!DEMO){
  // follow account / network changes made inside MetaMask, without a page reload
  ethereum.on("accountsChanged",a=>{if(flag.get())return;a.length?setup().catch(e=>toast(fmtErr(e))):resetUI()});
  ethereum.on("chainChanged",()=>{if(me&&!flag.get())setup().catch(e=>toast(fmtErr(e)))});
  // silent auto-reconnect on page load (unless you logged out)
  if(!flag.get())ethereum.request({method:"eth_accounts"}).then(a=>{if(a.length)setup()}).catch(()=>{});
}