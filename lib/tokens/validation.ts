import { utils } from 'ethers';

/**
 * Checks if the format of a given Ethereum address is acceptable
 * Does not check if this address exists on the blockchain
 */
export function isValidChainAddress (address?: string) {
  if (!address) {
    return false;
  }
  try {
    utils.getAddress(address);
    return true;
  }
  catch (error) {
    return false;
  }
}
