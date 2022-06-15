import { getMultiProviderFromGCP } from '../../../scripts/utils';
import { CoreEnvironmentConfig } from '../../../src/config';

import { agent } from './agent';
import { MainnetChains, mainnetConfigs } from './chains';
import { core } from './core';
import { infrastructure } from './infrastructure';

export const environment: CoreEnvironmentConfig<MainnetChains> = {
  transactionConfigs: mainnetConfigs,
  getMultiProvider: () => getMultiProviderFromGCP(mainnetConfigs, 'mainnet'),
  agent,
  core,
  infra: infrastructure,
};