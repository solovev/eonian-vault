// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import './sources/BaseFarmingSource.sol';
import './interfaces/IVault.sol';

contract Vault is ERC20, IVault, Ownable {
  using SafeERC20 for IERC20;

  BaseFarmingSource private farmingSource;

  IERC20 private underlyingToken;

  constructor(address _token)
    ERC20(string(abi.encodePacked("Eonian's ", ERC20(_token).name())), string(abi.encodePacked('eon', ERC20(_token).symbol())))
  {
    underlyingToken = IERC20(_token);
  }

  modifier ensureFarmingSourceSet() {
    require(address(farmingSource) != address(0), 'Farming Source is not initialized');
    _;
  }

  function deposit(uint256 amount) external override ensureFarmingSourceSet {
    require(amount > 0, 'Cannot deposit 0');

    uint256 totalSupply = totalSupply();
    uint256 shares = 0;
    if (totalSupply > 0) {
      shares = (amount * totalSupply) / getTotalBalance();
    } else {
      shares = amount;
    }

    _mint(msg.sender, shares);

    underlyingToken.safeTransferFrom(msg.sender, address(this), amount);

    // These operations should be extracted from transaction
    uint256 vaultBalance = getVaultBalance();
    underlyingToken.safeTransfer(address(farmingSource), vaultBalance);
    farmingSource.realizeExcessBalance();
  }

  function withdraw(uint256 amount) external override ensureFarmingSourceSet {
    uint256 shares = getShares(amount);
    uint256 senderBalance = balanceOf(msg.sender);
    if (senderBalance < shares) {
      shares = senderBalance;
      amount = getValueOfShares(shares);
    }

    _burn(msg.sender, shares);

    uint256 vaultBalance = getVaultBalance();
    if (amount > vaultBalance) {
      uint256 amountNeeded = amount - vaultBalance;
      uint256 loss = farmingSource.withdraw(amountNeeded);
      require(loss <= 0, 'TODO: Compensate missing amount');
    }

    underlyingToken.safeTransfer(address(this), amount);
  }

  function getValueOfShares(uint256 shares) public view returns (uint256) {
    uint256 totalSupply = totalSupply();
    if (totalSupply == 0) {
      return shares;
    }
    return (shares * getTotalBalance()) / totalSupply;
  }

  /// @notice Returns shares from the specified amount of tokens
  function getShares(uint256 amount) public view returns (uint256) {
    uint256 balance = getTotalBalance();
    if (balance == 0) {
      return 0;
    }
    return (amount * totalSupply()) / balance;
  }

  /// @notice
  ///     Returns the total quantity of underlying token under control of this contract,
  ///     whether they're stored in a farming source, or currently held in the Vault.
  function getTotalBalance() public view override returns (uint256) {
    return getVaultBalance() + farmingSource.getEstimatedTotalBalance();
  }

  function getVaultBalance() private view returns (uint256) {
    return underlyingToken.balanceOf(address(this));
  }

  function setFarmingSource(address _farmingSource) external override onlyOwner {
    farmingSource = BaseFarmingSource(_farmingSource);
  }

  function getFarmingSource() external view override returns (address) {
    return address(farmingSource);
  }

  function getUnderlyingToken() public view override returns (address) {
    return address(underlyingToken);
  }

  /// @dev Used in tests
  receive() external payable {}
}
