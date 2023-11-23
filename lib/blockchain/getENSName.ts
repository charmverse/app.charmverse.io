import { log } from '@charmverse/core/log';
import { JsonRpcProvider, ethers, isValidName } from 'ethers';

import { isTestEnv } from 'config/constants';

const providerKey = process.env.ALCHEMY_API_KEY;
const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${providerKey}`;
const provider = providerKey ? new JsonRpcProvider(providerUrl) : null;

export function getENSName(address: string) {
  if (!provider) {
    if (!isTestEnv) {
      log.warn('No api key provided for Alchemy');
    }
    return null;
  }
  return provider.lookupAddress(address).catch((error) => {
    log.warn('Error looking up ENS name for address', { error });
    return null;
  });
}

export async function getENSDetails(ensName?: string | null) {
  if (!ensName) {
    return null;
  }

  if (!provider) {
    if (!isTestEnv) {
      log.warn('No api key provided for Alchemy');
    }
    return null;
  }

  if (!isValidName(ensName)) {
    log.warn(`The ens name ${ensName} you provided is not valid`);
    return null;
  }

  try {
    const resolver = await provider.getResolver(ensName);
    const avatar = await provider.getAvatar(ensName);
    const [description, discord, github, twitter, reddit, linkedin, emails] = await Promise.all(
      ['description', 'com.discord', 'com.github', 'com.twitter', 'com.reddit', 'com.linkedin', 'emails'].map((text) =>
        resolver?.getText(text)
      )
    );

    return { avatar, description, discord, github, twitter, reddit, linkedin, emails };
  } catch (error) {
    log.warn(`Error looking up ENS details for ens name ${ensName}`, { error });
    return null;
  }
}
