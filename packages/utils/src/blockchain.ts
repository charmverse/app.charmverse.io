import type { UserWallet } from '@charmverse/core/prisma';
import { isAddress } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export function randomETHWalletAddress(privateKey?: ReturnType<typeof generatePrivateKey>) {
  return randomETHWallet(privateKey).address;
}

export function randomETHWallet(privateKey = generatePrivateKey()): { address: `0x${string}` } {
  return privateKeyToAccount(privateKey);
}

export const shortenHex = (hex: string = '', length = 4): string => {
  return `${hex.substring(0, length + 2)}…${hex.substring(hex.length - length)}`;
};

/**
 * Shortens valid wallet addresses, leaves other strings unchanged
 */
export function shortWalletAddress(string?: string): string {
  if (!string) {
    return '';
  }

  if (isAddress(string)) {
    return shortenHex(string).toLowerCase();
  }

  return string;
}

/**
 * Tie a wallet address to a short address, or its mixed case format
 */
export function matchWalletAddress(
  address1: string,
  address2: string | Pick<UserWallet, 'address' | 'ensname'>
): boolean {
  if (!address1 || !address2) {
    return false;
  }
  const ensname = typeof address2 === 'string' ? null : address2.ensname;

  if (ensname === address1) {
    return true;
  }

  const baseAddress = typeof address2 === 'string' ? address2 : address2.address;

  return shortWalletAddress(address1) === shortWalletAddress(baseAddress);
}
