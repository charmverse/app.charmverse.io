import { credentialsWalletPrivateKey } from '@root/config/constants';
import { getChainById } from '@root/connectors/chains';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia } from 'viem/chains';

import { InvalidInputError } from '../utils/errors';

export function getWalletClient({ chainId, privateKey }: { chainId: number; privateKey: string }) {
  const chain = getChainById(chainId);

  if (!chain?.viem) {
    throw new InvalidInputError(`Chain id ${chainId} does not yet contain a viem connector`);
  }

  const prefixedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  return createWalletClient({
    chain: chain.viem,
    account: privateKeyToAccount(prefixedPrivateKey as `0x${string}`),
    transport: http(chain.rpcUrls[0], {
      retryCount: 1,
      timeout: 5000
    })
  }).extend(publicActions);
}

const client = getWalletClient({ chainId: optimismSepolia.id, privateKey: credentialsWalletPrivateKey as string });
