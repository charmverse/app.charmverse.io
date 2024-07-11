import { getChainById } from '@root/connectors/chains';
import type { Signer } from 'ethers';
import { Wallet, providers } from 'ethers';

import { credentialsWalletPrivateKey } from '@root/config/constants';

export function getCharmverseSigner({ chainId }: { chainId: number }): Signer {
  const rpcUrl = getChainById(chainId)?.rpcUrls[0];

  const provider = new providers.JsonRpcProvider(rpcUrl, chainId);

  return new Wallet(credentialsWalletPrivateKey as string, provider);
}
