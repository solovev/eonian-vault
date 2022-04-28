// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IFarmingSource.sol";
import "../interfaces/IVault.sol";

abstract contract BaseFarmingSource is IFarmingSource, Initializable {
    using SafeERC20 for IERC20Metadata;

    IERC20Metadata public underlyingToken;
    IVault public vault;

    modifier onlyVault() {
        require(
            msg.sender == address(vault),
            "Only vault can execute this function"
        );
        _;
    }

    function initializeBase(address _vault) internal onlyInitializing {
        vault = IVault(_vault);

        underlyingToken = IERC20Metadata(vault.getUnderlyingToken());
        underlyingToken.safeApprove(_vault, type(uint256).max);
    }

    function getUnderlyingTokenBalance()
        public
        view
        override
        returns (uint256)
    {
        return underlyingToken.balanceOf(address(this));
    }
}
