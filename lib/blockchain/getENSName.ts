import { log } from '@charmverse/core/log';
import { getAddress } from 'viem';
import { normalize } from 'viem/ens';

import { getPublicClient } from './publicClient';

export async function getENSName(_address: string) {
  const publicClient = getPublicClient(1);
  const address = getAddress(_address);

  return publicClient.getEnsName({ address });
}

export function resolveENSName(ensName: string) {
  const publicClient = getPublicClient(1);

  return publicClient.getEnsAddress({ name: normalize(ensName) });
}

export async function getENSDetails(ensName?: string | null) {
  if (!ensName) {
    return null;
  }

  const name = normalize(ensName);

  const publicClient = getPublicClient(1);

  try {
    const avatar = await publicClient.getEnsAvatar({ name });
    const [description, discord, github, twitter, reddit, linkedin, emails] = await Promise.all(
      ['description', 'com.discord', 'com.github', 'com.twitter', 'com.reddit', 'com.linkedin', 'emails'].map(
        async (key) => publicClient.getEnsText({ name, key })
      )
    );

    return { avatar, description, discord, github, twitter, reddit, linkedin, emails };
  } catch (error) {
    log.warn(`Error looking up ENS details for ens name ${ensName}`, { error });
    return null;
  }
}
