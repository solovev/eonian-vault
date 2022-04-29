import '@nomiclabs/hardhat-ethers';
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { getWallet, deploy, transferFromWallet, withDecimals, executeBehalfOf, resetBlockchainAfterEach } from './Utils';
import { MockContract, smock } from '@defi-wonderland/smock';
import chai from 'chai';
import { CompoundFarmingSource, ERC20, ICERC20, Vault, Vault__factory } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BaseContract, BigNumber, ContractTransaction } from 'ethers';
import { forkConfig } from '../hardhat.config';

chai.use(smock.matchers);

const DAI_ABI = require('./abi/dai_abi.json');
const CDAI_ABI = require('./abi/cdai_abi.json');

const addresses = {
  DAI: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
  cDAI: '0x6d7f0754ffeb405d23c51ce938289d4835be3b14',
  cUSDC: '0x5b281a6dda0b271e91ae35de655ad301c976edb1',
};

const tokenContract = new ethers.Contract(addresses.DAI, DAI_ABI, ethers.provider) as ERC20;

const cTokenContract = new ethers.Contract(addresses.cDAI, CDAI_ABI, ethers.provider) as ERC20 & ICERC20;

describe('CompoundFarmingSource', function () {
  let vaultContract: MockContract<Vault>;
  let wallet: SignerWithAddress;

  const initMocks = async () => {
    const tokenAddress = addresses.DAI;
    const factory = await smock.mock<Vault__factory>('Vault');
    vaultContract = await factory.deploy(tokenAddress);
    wallet = await getWallet();
  };

  beforeEach((done) => {
    initMocks().then(done);
  });

  afterEach(resetBlockchainAfterEach);
});
