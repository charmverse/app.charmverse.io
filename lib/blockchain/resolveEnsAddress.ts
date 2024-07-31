import { wagmiConfig } from '@root/connectors/config';
import { getEnsAddress } from '@wagmi/core';
import { normalize } from 'viem/ens';

export async function resolveEnsAddress(ensName: string): Promise<string | null> {
  return getEnsAddress(wagmiConfig, { chainId: 1, name: normalize(ensName) });
}
