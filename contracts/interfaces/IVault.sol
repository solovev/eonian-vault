// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IVault {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function getUnderlyingToken() external view returns (address);

    function getTotalBalance() external view returns (uint256);

    function setFarmingSource(address _farmingSource) external;

    function getFarmingSource() external view returns (address);
}
