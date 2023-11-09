import { ALL_LIT_CHAINS, LIT_CHAINS } from '@lit-protocol/constants';
import type { HumanizedAccsProps } from '@lit-protocol/types';
import { formatEther, isAddress } from 'ethers/lib/utils';
import { base } from 'viem/chains';

import { shortWalletAddress } from 'lib/utilities/blockchain';

// Add missing info for Base
LIT_CHAINS.base = {
  contractAddress: null,
  chainId: base.id,
  name: base.name,
  symbol: 'ETH',
  decimals: 18,
  rpcUrls: base.rpcUrls.default.http.slice(),
  blockExplorerUrls: [base.blockExplorers.default.url],
  type: null,
  vmType: 'EVM'
};

ALL_LIT_CHAINS.base = LIT_CHAINS.base;

export const humanizeComparator = (comparator: string) => {
  const list: Record<string, string> = {
    '>': 'more than',
    '>=': 'at least',
    '=': 'exactly',
    '<': 'less than',
    '<=': 'at most',
    contains: 'contains'
  };

  const selected: string | undefined = list[comparator];

  if (!selected) {
    return '';
  }

  return selected;
};

export function humanizeConditions(conditions: HumanizedAccsProps) {
  const myWalletAddress = conditions.myWalletAddress;
  const humanReadableConditions = conditions.unifiedAccessControlConditions
    ?.map((acc) => {
      if ('operator' in acc && !!acc.operator) {
        return `${acc.operator}`;
      }

      if ('chain' in acc && !!acc.chain && 'standardContractType' in acc) {
        const chainDetails = ALL_LIT_CHAINS[acc.chain];
        const tokenSymbol = chainDetails?.symbol;
        const value = acc.returnValueTest.value;
        const balance = Number(value) ? formatEther(value) : value;
        const comparator = humanizeComparator(acc.returnValueTest.comparator);
        const isValidValueAddress = isAddress(value);
        const tokenName =
          'name' in acc && typeof acc.name === 'string' && acc.name
            ? acc.name
            : shortWalletAddress(acc.contractAddress);
        const chain = acc.chain.charAt(0).toUpperCase() + acc.chain.slice(1);

        if (acc.standardContractType === 'timestamp' && acc.method === 'eth_getBlockByNumber') {
          return `Latest mined block must be past the unix timestamp ${value}`;
        } else if (acc.standardContractType === 'MolochDAOv2.1' && acc.method === 'members') {
          // molochDAOv2.1 membership
          return `Is a member of the DAO at ${acc.contractAddress}`;
        } else if (acc.standardContractType === 'ERC721' && acc.method === 'ownerOf') {
          // specific erc721
          return `Owner of ${tokenName} on ${chain}`;
        } else if (
          acc.standardContractType === 'ERC721' &&
          acc.method === 'balanceOf' &&
          acc.contractAddress === '0x22C1f6050E56d2876009903609a2cC3fEf83B415' &&
          acc.returnValueTest.comparator === '>' &&
          acc.returnValueTest.value === '0'
        ) {
          // for POAP main contract where the user owns at least 1 poap
          return `Owns any POAP`;
        } else if (acc.standardContractType === 'POAP' && acc.method === 'tokenURI') {
          // owns a POAP
          return `Owner of a ${value} POAP on ${chain}`;
        } else if (acc.standardContractType === 'POAP' && acc.method === 'eventId') {
          // owns a POAP
          return `Owner of a POAP from event ID ${value} on ${chain}`;
        } else if (acc.standardContractType === 'CASK' && acc.method === 'getActiveSubscriptionCount') {
          // Cask powered subscription
          return `Cask subscriber to provider ${acc.parameters[1]} for plan ${acc.parameters[2]} on ${chain}`;
        } else if (acc.standardContractType === 'ERC1155' && acc.method === 'balanceOf') {
          // erc1155 owns an amount of specific tokens
          return `Owns ${comparator} ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1]} on ${chain}`;
        } else if (acc.standardContractType === 'ERC1155' && acc.method === 'balanceOfBatch') {
          // erc1155 owns an amount of specific tokens from a batch of token ids
          return `Owns ${comparator} ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1]
            .split(',')
            .join(' or ')} on ${chain}`;
        } else if (acc.standardContractType === 'ERC721' && acc.method === 'balanceOf') {
          // any erc721 in collection
          return `Owns ${comparator} ${value} of ${tokenName} nft on ${chain}`;
        } else if (acc.standardContractType === 'ERC20' && acc.method === 'balanceOf') {
          return `Owns ${comparator} ${balance} of ${tokenName} tokens on ${chain}`;
        } else if (acc.standardContractType === '' && acc.method === 'eth_getBalance') {
          return `Owns ${comparator} ${balance} ${tokenSymbol} on ${chain}`;
        } else if (acc.standardContractType === '' && acc.method === '' && isValidValueAddress) {
          if (myWalletAddress && acc.returnValueTest.value.toLowerCase() === myWalletAddress.toLowerCase()) {
            return `Controls your wallet (${shortWalletAddress(myWalletAddress)})`;
          } else {
            return `Controls wallet with address ${shortWalletAddress(value)}`;
          }
        }

        return 'Oops. something went wrong!';
      }
      return '';
    })
    .join(' ');

  return humanReadableConditions || 'No conditions';
}
