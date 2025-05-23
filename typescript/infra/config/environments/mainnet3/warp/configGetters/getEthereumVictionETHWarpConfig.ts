import { ethers } from 'ethers';

import {
  ChainMap,
  HypTokenRouterConfig,
  OwnableConfig,
  TokenType,
} from '@hyperlane-xyz/sdk';

import { RouterConfigWithoutOwner } from '../../../../../src/config/warp.js';

export const getEthereumVictionETHWarpConfig = async (
  routerConfig: ChainMap<RouterConfigWithoutOwner>,
  abacusWorksEnvOwnerConfig: ChainMap<OwnableConfig>,
): Promise<ChainMap<HypTokenRouterConfig>> => {
  const viction: HypTokenRouterConfig = {
    ...routerConfig.viction,
    ...abacusWorksEnvOwnerConfig.viction,
    type: TokenType.synthetic,
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    gas: 50_000,
    interchainSecurityModule: ethers.constants.AddressZero,
  };

  const ethereum: HypTokenRouterConfig = {
    ...routerConfig.ethereum,
    ...abacusWorksEnvOwnerConfig.ethereum,
    type: TokenType.native,
    gas: 65_000,
    interchainSecurityModule: ethers.constants.AddressZero,
    hook: '0xb87ac8ea4533ae017604e44470f7c1e550ac6f10',
  };

  return {
    viction,
    ethereum,
  };
};
