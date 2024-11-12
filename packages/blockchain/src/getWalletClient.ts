import { InvalidInputError } from '@charmverse/core/errors';
import { createWalletClient, http, publicActions } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';

import { getChainById } from './chains';

export function getWalletClient({
  chainId,
  privateKey,
  mnemonic
}: {
  chainId: number;
  privateKey?: string;
  mnemonic?: string;
}) {
  const chain = getChainById(chainId);

  if (!chain?.viem) {
    throw new InvalidInputError(`Chain id ${chainId} does not yet contain a viem connector`);
  }

  if (!privateKey && !mnemonic) {
    throw new InvalidInputError('Private key or mnemonic is required to create a wallet client');
  }

  const account = mnemonic
    ? mnemonicToAccount(mnemonic)
    : privateKeyToAccount((privateKey!.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`);

  return createWalletClient({
    chain: chain.viem,
    account,
    transport: http(chain.rpcUrls[0], {
      retryCount: 1,
      timeout: 5000
    })
  }).extend(publicActions);
}
