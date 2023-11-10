import { ALL_LIT_CHAINS, LIT_CHAINS } from '@lit-protocol/constants';
import type { HumanizedAccsProps } from '@lit-protocol/types';
import type { TypographyProps } from '@mui/material/Typography';
import { formatEther, isAddress } from 'ethers/lib/utils';
import { base } from 'viem/chains';

import { shortWalletAddress } from 'lib/utilities/blockchain';
import { isTruthy } from 'lib/utilities/types';

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

export type HumanizeConditionsType = 'text' | 'image' | 'button' | 'link' | 'break' | 'operator';

export type HumanizeConditionsContent = {
  type: HumanizeConditionsType;
  url?: string;
  content: string;
  props?: TypographyProps;
};

export type HumanizeConditionsData = HumanizeConditionsContent[][];

export function humanizeConditionsData(conditions: HumanizedAccsProps) {
  const myWalletAddress = conditions.myWalletAddress;
  const humanReadableConditions = conditions.unifiedAccessControlConditions
    ?.map((acc) => {
      const row = 'row' as const;
      if ('operator' in acc && !!acc.operator) {
        // AND | OR
        return [{ type: 'operator', content: acc.operator }];
      }

      if ('chain' in acc && !!acc.chain && 'standardContractType' in acc) {
        const chainDetails = ALL_LIT_CHAINS[acc.chain];
        const tokenSymbol = chainDetails?.symbol;
        const value = acc.returnValueTest.value;
        const balance = Number(value) ? formatEther(value) : value;
        const comparator = humanizeComparator(acc.returnValueTest.comparator);
        const isValidValueAddress = isAddress(value);
        const image = 'image' in acc && typeof acc.image === 'string' && acc.image ? acc.image : undefined;
        const tokenName =
          'name' in acc && typeof acc.name === 'string' && acc.name
            ? acc.name
            : shortWalletAddress(acc.contractAddress);
        const chain = acc.chain.charAt(0).toUpperCase() + acc.chain.slice(1);

        if (acc.standardContractType === 'timestamp' && acc.method === 'eth_getBlockByNumber') {
          // Latest mined block must be past the unix timestamp ${value}
          return [
            { type: 'image', url: image, content: acc.chain },
            { type: 'text', content: `Latest mined block must be past the unix timestamp` },
            { type: 'text', content: value }
          ];
        } else if (acc.standardContractType === 'MolochDAOv2.1' && acc.method === 'members') {
          // molochDAOv2.1 membership
          // Is a member of the DAO at ${shortWalletAddress(acc.contractAddress)}
          return [
            { type: 'image', url: image, content: acc.chain },
            { type: 'text', content: `Is a member of the DAO at` },
            { type: 'text', content: shortWalletAddress(acc.contractAddress), props: { fontWeight: 'bold' } }
          ];
        } else if (acc.standardContractType === 'ERC721' && acc.method === 'ownerOf') {
          // specific erc721
          // Owner of ${tokenName} on ${chain}
          return [
            { type: 'image', url: image, content: tokenName },
            { type: 'text', content: 'Owner of' },
            { type: 'button', content: tokenName, props: { fontWeight: 'bold' } },
            { type: 'text', content: 'on' },
            { type: 'text', content: chain }
          ];
        } else if (
          acc.standardContractType === 'ERC721' &&
          acc.method === 'balanceOf' &&
          acc.contractAddress === '0x22C1f6050E56d2876009903609a2cC3fEf83B415' &&
          acc.returnValueTest.comparator === '>' &&
          acc.returnValueTest.value === '0'
        ) {
          // for POAP main contract where the user owns at least 1 poap
          // Owns any POAP
          return [
            { type: 'image', url: image, content: acc.chain },
            { type: 'text', content: `Owns any POAP` }
          ];
        } else if (acc.standardContractType === 'POAP' && acc.method === 'tokenURI') {
          // owns a POAP
          // Owner of a ${value} POAP on ${chain}
          return [
            { type: 'image', url: image, content: 'POAP' },
            { type: 'text', content: 'Owner of a' },
            { type: 'button', content: value, props: { fontWeight: 'bold' } },
            { type: 'text', content: 'POAP on' },
            { type: 'text', content: chain }
          ];
        } else if (acc.standardContractType === 'POAP' && acc.method === 'eventId') {
          // owns a POAP
          // Owner of a POAP from event ID ${value} on ${chain}
          return [
            { type: 'image', url: image, content: 'POAP' },
            { type: 'text', content: 'Owner of a POAP from event ID' },
            { type: 'button', content: value, props: { fontWeight: 'bold' } },
            { type: 'text', content: 'on' },
            { type: 'text', content: chain }
          ];
        } else if (acc.standardContractType === 'CASK' && acc.method === 'getActiveSubscriptionCount') {
          // Cask powered subscription
          // Cask subscriber to provider ${acc.parameters[1]} for plan ${acc.parameters[2]} on ${chain}
          return [
            { type: 'image', url: image, content: acc.chain },
            { type: 'text', content: `Cask subscriber to provider` },
            { type: 'button', content: acc.parameters[1], props: { fontWeight: 'bold' } },
            { type: 'text', content: `for plan` },
            { type: 'button', content: acc.parameters[2], props: { fontWeight: 'bold' } },
            { type: 'text', content: `on` },
            { type: 'text', content: chain }
          ];
        } else if (acc.standardContractType === 'ERC1155' && acc.method === 'balanceOf') {
          // erc1155 owns an amount of specific tokens
          // Owns ${comparator} ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1]} on ${chain}
          return [
            { type: 'image', url: image, content: chain },
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: value },
            { type: 'text', content: `of` },
            { type: 'link', content: shortWalletAddress(acc.contractAddress), props: { fontWeight: 'bold' } },
            { type: 'text', content: `tokens with token id` },
            { type: 'text', content: acc.parameters[1] },
            { type: 'text', content: `on` },
            { type: 'text', content: chain }
          ];
        } else if (acc.standardContractType === 'ERC1155' && acc.method === 'balanceOfBatch') {
          // erc1155 owns an amount of specific tokens from a batch of token ids
          // Owns ${comparator} ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1].split(',').join(' or ')} on ${chain}
          return [
            { type: 'image', url: image, content: acc.chain },
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: value },
            { type: 'text', content: `of` },
            { type: 'button', content: shortWalletAddress(acc.contractAddress), props: { fontWeight: 'bold' } },
            { type: 'text', content: `tokens with token id` },
            {
              type: 'text',
              content: `${acc.parameters[1].split(',').join(' or ')}`
            },
            { type: 'text', content: `on` },
            { type: 'text', content: chain }
          ];
        } else if (acc.standardContractType === 'ERC721' && acc.method === 'balanceOf') {
          // any erc721 in collection
          // Owns ${comparator} ${value} of ${tokenName} nft on ${chain}
          return [
            { type: 'image', url: image, content: tokenName },
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: value },
            { type: 'text', content: `of` },
            { type: 'button', content: tokenName, props: { fontWeight: 'bold' } },
            { type: 'text', content: `nft on` },
            { type: 'text', content: chain }
          ];
        } else if (acc.standardContractType === 'ERC20' && acc.method === 'balanceOf') {
          // Owns ${comparator} ${balance} of ${tokenName} tokens on ${chain}
          return [
            { type: 'image', url: image, content: tokenName },
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: balance },
            { type: 'text', content: `of` },
            { type: 'button', content: tokenName, props: { fontWeight: 'bold' } },
            { type: 'text', content: `tokens on` },
            { type: 'text', content: chain }
          ];
        } else if (acc.standardContractType === '' && acc.method === 'eth_getBalance') {
          // Owns ${comparator} ${balance} ${tokenSymbol} on ${chain}
          return [
            { type: 'image', url: image, content: chain },
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: balance },
            { type: 'text', content: `${tokenSymbol} on` },
            { type: 'text', content: chain }
          ];
        } else if (acc.standardContractType === '' && acc.method === '' && isValidValueAddress) {
          if (myWalletAddress && acc.returnValueTest.value.toLowerCase() === myWalletAddress.toLowerCase()) {
            // Controls your wallet ${shortWalletAddress(myWalletAddress)}
            return [
              { type: 'image', url: image, content: acc.chain },
              { type: 'text', content: `Controls your wallet` },
              { type: 'button', content: shortWalletAddress(myWalletAddress), props: { fontWeight: 'bold' } }
            ];
          } else {
            // Controls wallet with address ${shortWalletAddress(value)}
            return [
              { type: 'image', url: image, content: acc.chain },
              { type: 'text', content: `Controls wallet with address` },
              { type: 'text', content: shortWalletAddress(value), props: { fontWeight: 'bold' } }
            ];
          }
        }

        // Show a simple error message
        return [{ type: 'text', content: 'Oops. something went wrong!' }];
      }
      return undefined;
    })
    .filter(isTruthy);

  return (humanReadableConditions || []) as HumanizeConditionsData;
}

export function humanizeConditions(conditions: HumanizeConditionsData) {
  return conditions
    .map((condition) => {
      return condition
        .filter((c) => c.type !== 'image')
        .map((c) => {
          return c.content;
        })
        .join(' ');
    })
    .join(' ');
}
