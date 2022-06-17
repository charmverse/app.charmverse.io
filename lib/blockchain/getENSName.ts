import { ethers } from 'ethers';
import log from 'lib/log';

const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

export default function getENSName (address: string) {
  return provider.lookupAddress(address)
    .catch(error => {
      log.warn('Error looking up ENS name for address', { error });
      return null;
    });
}
