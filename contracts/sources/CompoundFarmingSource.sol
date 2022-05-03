// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/math/Math.sol';
import './BaseFarmingSource.sol';

interface ICERC20 {
  function underlying() external view returns (address);

  function balanceOf(address owner) external view returns (uint256);

  function balanceOfUnderlying(address owner) external returns (uint256);

  function mint(uint256) external returns (uint256);

  function exchangeRateCurrent() external returns (uint256);

  function supplyRatePerBlock() external view returns (uint256);

  function redeem(uint256) external returns (uint256);

  function redeemUnderlying(uint256) external returns (uint256);

  function getCash() external view returns (uint256);

  function approve(address spender, uint256 value) external returns (bool success);

  function allowance(address owner, address spender) external view returns (uint256);
}

contract CompoundFarmingSource is BaseFarmingSource {
  using SafeERC20 for IERC20Metadata;

  ICERC20 private compoundToken;

  uint256 private exchangeRate;
  uint256 private exchangeRateUpdatedAt;

  event Withdraw(uint256 requiredAmount, uint256 loss);

  /// @notice
  ///     Recalculates current exchange rate for compound <-> underlying token.
  /// @dev
  ///     This modifier should be replaced by the keeper function call.
  ///     Or we can just use the exchangeRateStored() function from the compount token contract.
  modifier _updateExchangeRate() {
    _;
    updateExchangeRate();
  }

  modifier ensureExchangeRateFresh() {
    require(block.number - exchangeRateUpdatedAt <= 1, 'Exchange rate outdated');
    _;
  }

  function initialize(address _vault, address _compoundToken) external initializer {
    exchangeRateUpdatedAt = block.number;

    initializeBase(_vault);

    compoundToken = ICERC20(_compoundToken);
    require(vault.getUnderlyingToken() == compoundToken.underlying(), "Underlying tokens don't match");
  }

  function realizeExcessBalance() public override _updateExchangeRate {
    uint256 unrealizedAssets = getUnderlyingTokenBalance();
    require(unrealizedAssets > 0, 'All assets have already been realized');

    underlyingToken.approve(address(compoundToken), unrealizedAssets);

    uint256 mintResult = compoundToken.mint(unrealizedAssets);
    require(mintResult == 0, 'Compound mint failed');
  }

  function withdraw(uint256 requiredAmount) public override onlyVault _updateExchangeRate ensureExchangeRateFresh returns (uint256) {
    require(requiredAmount > 0, 'Cannot withdraw 0');

    uint256 underlyingBalance = getUnderlyingTokenBalance();
    if (requiredAmount <= underlyingBalance) {
      underlyingToken.safeTransfer(address(vault), requiredAmount);
      return 0;
    }

    uint256 lackBalance = requiredAmount - underlyingBalance;
    uint256 suppliedBalance = getSuppliedBalance();
    uint256 amountToRedeem = Math.min(lackBalance, suppliedBalance);
    uint256 redeemResult = compoundToken.redeemUnderlying(amountToRedeem);
    require(redeemResult == 0, 'Compound redeem failed');

    underlyingBalance = getUnderlyingTokenBalance();
    underlyingToken.safeTransfer(address(vault), underlyingBalance);

    uint256 loss = Math.max(requiredAmount - underlyingBalance, 0);

    emit Withdraw(requiredAmount, loss);

    return loss;
  }

  function updateExchangeRate() public {
    exchangeRate = compoundToken.exchangeRateCurrent();
    exchangeRateUpdatedAt = block.number;
  }

  function getEstimatedTotalBalance() public view override returns (uint256) {
    return getUnderlyingTokenBalance() + getSuppliedBalance();
  }

  /// @dev Using for testing purposes
  function getInterestRate() public view returns (uint256) {
    return compoundToken.supplyRatePerBlock();
  }

  /// @dev Whe can try to use `supplyRatePerBlock` to make this computation more accurate
  function getSuppliedBalance() internal view returns (uint256) {
    uint256 underlyingDecimals = underlyingToken.decimals();
    return (getCompoundTokenBalance() * exchangeRate) / 10**underlyingDecimals;
  }

  function getCompoundTokenBalance() internal view returns (uint256) {
    return compoundToken.balanceOf(address(this));
  }
}
