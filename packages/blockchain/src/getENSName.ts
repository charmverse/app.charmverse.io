import { log } from '@charmverse/core/log';
import { getAddress } from 'viem';
import { normalize } from 'viem/ens';

import { getAlchemyBaseUrl } from '../../../lib/blockchain/provider/alchemy/client';

import { getPublicClient } from './getPublicClient';

const isTestEnv = process.env.NODE_ENV === 'test';

export async function getENSName(_address: string) {
  if (isTestEnv) {
    return null;
  }
  const publicClient = getPublicClient(1);
  const address = getAddress(_address);

  return publicClient.getEnsName({ address });
}

/**
 * @param useAlchemy - This is useful on the server side to avoid rate limiting
 */
export function resolveENSName(ensName: string, useAlchemy?: boolean) {
  const publicClient = getPublicClient(1);

  if (useAlchemy) {
    publicClient.transport.url = getAlchemyBaseUrl(1);
  }

  return publicClient.getEnsAddress({ name: normalize(ensName) });
}

export async function getENSDetails(ensName?: string | null) {
  if (!ensName || isTestEnv) {
    return null;
  }

  const name = normalize(ensName);

  const publicClient = getPublicClient(1);

  try {
    const [avatar, description, discord, github, twitter, reddit, linkedin, emails] = await Promise.all(
      ['avatar', 'description', 'com.discord', 'com.github', 'com.twitter', 'com.reddit', 'com.linkedin', 'emails'].map(
        async (key) => publicClient.getEnsText({ name, key })
      )
    );

    const ensData = {
      avatar,
      description,
      discord,
      github,
      twitter,
      reddit,
      linkedin,
      emails
    };

    if (avatar?.startsWith('ipfs')) {
      ensData.avatar = `https://metadata.ens.domains/mainnet/avatar/${name}`;
    }

    return ensData;
  } catch (error) {
    log.warn(`Error looking up ENS details for ens name ${ensName}`, { error });
    return null;
  }
}
