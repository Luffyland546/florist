// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Rose - El's Flowers loyalty token (ERC-20). 1 Rose per 25 EUR spent.
contract RoseToken is ERC20, Ownable {
    uint256 public constant EUROS_PER_ROSE = 25;
    mapping(address => uint256) public lifetimeEarned; // drives NFT tiers (not reduced by redeeming/transfers)
    event PurchaseRewarded(address indexed customer, uint256 euros, uint256 roses);
    event Redeemed(address indexed customer, uint256 roses);

    constructor() ERC20("Rose", "ROSE") Ownable(msg.sender) {}
    function decimals() public pure override returns (uint8) { return 0; } // whole Roses only

    /// Called by the shop (till/backend) after a sale
    function rewardPurchase(address customer, uint256 euros) external onlyOwner {
        uint256 roses = euros / EUROS_PER_ROSE;
        require(roses > 0, "Spend at least 25 EUR");
        lifetimeEarned[customer] += roses;
        _mint(customer, roses);
        emit PurchaseRewarded(customer, euros, roses);
    }
    /// Customer burns Roses for a store discount / subscription top-up
    function redeem(uint256 roses) external { _burn(msg.sender, roses); emit Redeemed(msg.sender, roses); }
}
