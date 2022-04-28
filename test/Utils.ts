import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BaseContract, BigNumber, BigNumberish, Contract } from "ethers";
import { ethers, network } from "hardhat";
import { ERC20, ICERC20, IERC20, IERC20Metadata } from "../typechain-types";

export const TEST_WALLET_ADDRESS = "0xCc4C414D00D09aA25A8F6F12Fce61033bE2A7D22";

export async function getWallet(): Promise<SignerWithAddress> {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [TEST_WALLET_ADDRESS],
  });
  return ethers.getSigner(TEST_WALLET_ADDRESS);
}

export async function getBalance(tokenContract: unknown, address: string) {
  if (!isERC20(tokenContract)) {
    throw "Not ERC20 compliant";
  }
  const tokenDecimals = await tokenContract.decimals();
  const balance = await tokenContract.balanceOf(address);
  return +balance.toString() / Math.pow(10, tokenDecimals);
}

export async function deploy<T extends BaseContract>(
  name: string,
  ...args: any[]
): Promise<T> {
  const factory = await ethers.getContractFactory(name);
  const contract = (await factory.deploy(...args)) as T;
  await contract.deployed();
  return contract;
}

export async function transferFromWallet(options: {
  tokenContract: unknown;
  wallet: SignerWithAddress;
  toAddress: string;
  amount: number;
}): Promise<BigNumber> {
  const { tokenContract, wallet, toAddress, amount } = options;
  if (!isERC20(tokenContract)) {
    throw "Not ERC20 compliant";
  }
  const tokenContractWithSigner = tokenContract.connect(wallet);
  const tokenDecimals = await tokenContract.decimals();
  const value = BigNumber.from(amount).mul(
    BigNumber.from(10).pow(tokenDecimals)
  );
  await tokenContractWithSigner.transfer(toAddress, value);

  return value;
}

export async function toCountable(
  value: BigNumber,
  tokenContract: unknown
): Promise<number> {
  if (!isERC20(tokenContract)) {
    throw "Not ERC20 compliant";
  }
  const tokenDecimals = await tokenContract.decimals();
  return +value.toString() / Math.pow(10, tokenDecimals);
}

export async function withDecimals(
  value: BigNumberish,
  tokenContract: unknown
): Promise<BigNumber> {
  if (!isERC20(tokenContract)) {
    throw "Not ERC20 compliant";
  }
  const tokenDecimals = await tokenContract.decimals();
  return BigNumber.from(value).mul(BigNumber.from(10).pow(tokenDecimals));
}

function isERC20(contract: unknown): contract is IERC20Metadata {
  return (
    !!contract &&
    typeof contract === "object" &&
    "balanceOf" in contract &&
    "decimals" in contract
  );
}