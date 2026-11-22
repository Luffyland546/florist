// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IRose { function lifetimeEarned(address) external view returns (uint256); }

/// @title Blooming Flower NFTs (ERC-721): Daisy/Peony/Orchid tiers + wedding occasion NFTs
contract BloomingFlowerNFT is ERC721URIStorage, Ownable {
    IRose public immutable rose;
    uint256 public nextId = 1;
    uint256[4] public threshold = [0, 1000, 5000, 10000]; // Bronze, Silver, Gold
    uint8[4] public discountPercent = [0, 10, 15, 20];
    string[4] public tierURI;                              // ipfs:// metadata (Pinata)
    mapping(address => uint8) public tierOf;               // highest tier claimed
    mapping(uint256 => string) public kindOf;              // "Daisy", "Peony", "Orchid", "Occasion"
    event TierClaimed(address indexed customer, uint8 tier, uint256 tokenId);
    event OccasionMinted(address indexed to, uint256 tokenId);

    constructor(address roseToken) ERC721("Blooming Flower", "BLOOM") Ownable(msg.sender) { rose = IRose(roseToken); }

    function setTierURI(uint8 tier, string calldata uri) external onlyOwner { require(tier >= 1 && tier <= 3, "bad tier"); tierURI[tier] = uri; }

    function claimTier(uint8 tier) external {
        require(tier >= 1 && tier <= 3, "bad tier");
        require(tierOf[msg.sender] < tier, "Tier already claimed");
        require(rose.lifetimeEarned(msg.sender) >= threshold[tier], "Not enough Roses earned");
        require(bytes(tierURI[tier]).length > 0, "Tier metadata not set");
        tierOf[msg.sender] = tier;
        uint256 id = nextId++;
        _safeMint(msg.sender, id);
        _setTokenURI(id, tierURI[tier]);
        kindOf[id] = tier == 1 ? "Daisy" : tier == 2 ? "Peony" : "Orchid";
        emit TierClaimed(msg.sender, tier, id);
    }

    /// Custom wedding / event commemoration NFT, minted by the shop
    function mintOccasion(address to, string calldata uri) external onlyOwner returns (uint256 id) {
        id = nextId++;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        kindOf[id] = "Occasion";
        emit OccasionMinted(to, id);
    }

    function myDiscount(address who) external view returns (uint8) { return discountPercent[tierOf[who]]; }
}
