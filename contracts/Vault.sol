// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICERC20 {
    function mint(uint256) external returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function supplyRatePerBlock() external returns (uint256);

    function redeem(uint256) external returns (uint256);

    function redeemUnderlying(uint256) external returns (uint256);
}

contract Vault {
    event TokenReceived(address, uint256, uint256);
    event ExchangeRate(uint256);
    event SupplyRate(uint256);
    event Mint(uint256);

    IERC20 private underlyingToken;
    ICERC20 private compoundToken;

    constructor(address underlyingTokenAddress, address compoundTokenAddress) {
        underlyingToken = IERC20(underlyingTokenAddress);
        compoundToken = ICERC20(compoundTokenAddress);
    }

    function supply(uint256 amount) external returns (uint256) {
        address contractAddress = address(this);
        underlyingToken.transferFrom(msg.sender, contractAddress, amount);

        uint256 total = underlyingToken.balanceOf(contractAddress);
        emit TokenReceived(msg.sender, amount, total);

        uint256 exchangeRateMantissa = compoundToken.exchangeRateCurrent();
        emit ExchangeRate(exchangeRateMantissa);

        uint256 supplyRateMantissa = compoundToken.supplyRatePerBlock();
        emit SupplyRate(supplyRateMantissa);

        underlyingToken.approve(address(compoundToken), amount);

        uint256 mintResult = compoundToken.mint(amount);
        emit Mint(mintResult);

        return mintResult;
    }

    function getBalance() external view returns (uint256) {
        address contractAddress = address(this);
        return underlyingToken.balanceOf(contractAddress);
    }
}
