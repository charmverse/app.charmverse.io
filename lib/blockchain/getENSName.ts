import { ethers } from 'ethers';

import { isTestEnv } from 'config/constants';
import log from 'lib/log';

const providerKey = process.env.ALCHEMY_API_KEY;
const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${providerKey}`;
const provider = providerKey ? new ethers.providers.JsonRpcProvider(providerUrl) : null;

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

  if (!ethers.utils.isValidName(ensName)) {
    log.warn(`The ens name ${ensName} you provided is not valid`);
    return null;
  }

  try {
    const resolver = await provider.getResolver(ensName);
    const avatar = await provider.getAvatar(ensName);
    const [description, discord, github, twitter] = await Promise.all(
      ['description', 'com.discord', 'com.github', 'com.twitter'].map((text) => resolver?.getText(text))
    );

    return { avatar, description, discord, github, twitter };
  } catch (error) {
    log.warn(`Error looking up ENS details for ens name ${ensName}`, { error });
    return null;
  }
}
