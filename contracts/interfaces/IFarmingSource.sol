// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IFarmingSource {
    function realizeExcessBalance() external;

    function withdraw(uint256 requiredAmount) external returns (uint256);

    function getUnderlyingTokenBalance() external view returns (uint256);

    function getEstimatedTotalBalance() external view returns (uint256);
}
