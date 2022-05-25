import '@nomiclabs/hardhat-waffle';
import { ethers } from 'hardhat';
import path from 'path';

import { AbacusCoreDeployer, CoreConfig } from '@abacus-network/deploy';
import { getMultiProviderFromConfigAndSigner } from '@abacus-network/deploy/dist/src/utils';
import {
  AbacusCore,
  ChainMap,
  CoreContractAddresses,
  MultiProvider,
  objMap,
} from '@abacus-network/sdk';

import { environment as testConfig } from '../config/environments/test';
import { TestChains } from '../config/environments/test/chains';
import { AbacusCoreChecker } from '../src/core';
import { AbacusCoreInfraDeployer } from '../src/core/deploy';

describe('core', async () => {
  const environment = 'test';

  let multiProvider: MultiProvider<TestChains>;
  let deployer: AbacusCoreInfraDeployer<TestChains>;
  let core: AbacusCore<TestChains>;
  let addresses: ChainMap<TestChains, CoreContractAddresses<TestChains, any>>;
  let coreConfig: ChainMap<TestChains, CoreConfig>;

  let owners: ChainMap<TestChains, string>;
  before(async () => {
    const [signer, owner] = await ethers.getSigners();
    // This is kind of awkward and really these tests shouldn't live here
    multiProvider = getMultiProviderFromConfigAndSigner(
      testConfig.transactionConfigs,
      signer,
    );
    coreConfig = testConfig.core;
    deployer = new AbacusCoreInfraDeployer(multiProvider, coreConfig);
    owners = objMap(testConfig.transactionConfigs, () => owner.address);
  });

  it('deploys', async () => {
    addresses = await deployer.deploy(); // TODO: return AbacusApp from AbacusDeployer.deploy()
  });

  it('writes', async () => {
    const base = './test/outputs/core';
    deployer.writeVerification(path.join(base, 'verification'));
    deployer.writeContracts(addresses, path.join(base, 'contracts.ts'));
    deployer.writeRustConfigs(environment, path.join(base, 'rust'), addresses);
  });

  it('transfers ownership', async () => {
    core = new AbacusCore(addresses, multiProvider);
    await AbacusCoreDeployer.transferOwnership(core, owners, multiProvider);
  });

  it('checks', async () => {
    const joinedConfig = objMap(coreConfig, (chain, config) => ({
      ...config,
      owner: owners[chain],
    }));
    const checker = new AbacusCoreChecker(multiProvider, core, joinedConfig);
    await checker.check();
  });
});