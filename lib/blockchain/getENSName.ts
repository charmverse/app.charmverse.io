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
