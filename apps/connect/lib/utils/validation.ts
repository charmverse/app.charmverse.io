import { getAddress } from 'viem/utils';

/**
 * Checks if the format of a given Ethereum address is acceptable
 * Does not check if this address exists on the blockchain
 */
export function isValidChainAddress(address?: string) {
  if (!address) {
    return false;
  }
  try {
    getAddress(address);
    return true;
  } catch (error) {
    return false;
  }
}
