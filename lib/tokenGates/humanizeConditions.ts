import { log } from '@charmverse/core/log';
import type { HumanizedAccsProps } from '@lit-protocol/types';
import type { TypographyProps } from '@mui/material/Typography';
import { formatEther, isAddress } from 'viem';

import { shortWalletAddress } from 'lib/utilities/blockchain';
import { isTruthy } from 'lib/utilities/types';

import { ALL_LIT_CHAINS } from './utils';

const humanizeComparator = (comparator: string) => {
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

type HumanizeConditionsContentType = 'text' | 'link' | 'operator';

export type HumanizeConditionsContent = {
  type: HumanizeConditionsContentType;
  url?: string;
  content: string;
  props?: TypographyProps;
};

export type HumanizeCondition = {
  image?: string;
  content: HumanizeConditionsContent[];
};

export function humanizeConditionsData(conditions: HumanizedAccsProps) {
  const myWalletAddress = conditions.myWalletAddress;
  const humanReadableConditions = conditions.unifiedAccessControlConditions
    ?.map<HumanizeCondition | undefined>((acc) => {
      if ('operator' in acc && !!acc.operator) {
        // AND | OR
        return {
          content: [{ type: 'operator', content: acc.operator }]
        };
      }

      if ('chain' in acc && !!acc.chain && 'standardContractType' in acc) {
        const chainDetails = ALL_LIT_CHAINS[acc.chain];
        const tokenSymbol = chainDetails?.symbol;
        const value = acc.returnValueTest.value;
        const balance = Number(value) ? formatEther(BigInt(value)) : value;
        const comparator = humanizeComparator(acc.returnValueTest.comparator);
        const isValidValueAddress = isAddress(value);
        const image = 'image' in acc && typeof acc.image === 'string' && acc.image ? acc.image : undefined;
        const hasName = 'name' in acc && typeof acc.name === 'string' && acc.name;
        const tokenName = hasName ? (acc.name as string) : shortWalletAddress(acc.contractAddress);
        const etherscanUrl: HumanizeConditionsContent = !hasName
          ? { type: 'link', url: `https://etherscan.io/address/${acc.contractAddress}`, content: '' }
          : { type: 'text', content: '' };
        const chain = acc.chain.charAt(0).toUpperCase() + acc.chain.slice(1);

        if (acc.standardContractType === 'timestamp' && acc.method === 'eth_getBlockByNumber') {
          // Latest mined block must be past the unix timestamp ${value}
          return {
            image,
            content: [
              { type: 'text', content: `Latest mined block must be past the unix timestamp` },
              { type: 'text', content: value }
            ]
          };
        } else if (acc.standardContractType === 'MolochDAOv2.1' && acc.method === 'members') {
          // molochDAOv2.1 membership
          // Is a member of the DAO at ${shortWalletAddress(acc.contractAddress)}
          return {
            image,
            content: [
              { type: 'text', content: `Is a member of the DAO at` },
              { ...etherscanUrl, content: shortWalletAddress(acc.contractAddress), props: { fontWeight: 'bold' } }
            ]
          };
        } else if (acc.standardContractType === 'ERC721' && acc.method === 'ownerOf') {
          // specific erc721
          // Owner of ${tokenName} on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: 'Owner of' },
              { ...etherscanUrl, content: tokenName, props: { fontWeight: 'bold' } },
              { type: 'text', content: 'on' },
              { type: 'text', content: chain }
            ]
          };
        } else if (
          acc.standardContractType === 'ERC721' &&
          acc.method === 'balanceOf' &&
          acc.contractAddress === '0x22C1f6050E56d2876009903609a2cC3fEf83B415' &&
          acc.returnValueTest.comparator === '>' &&
          acc.returnValueTest.value === '0'
        ) {
          // for POAP main contract where the user owns at least 1 poap
          // Owns any POAP
          return {
            image,
            content: [{ type: 'text', content: `Owns any POAP` }]
          };
        } else if (acc.standardContractType === 'POAP' && acc.method === 'tokenURI') {
          // owns a POAP
          // Owner of a ${value} POAP on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: 'Owner of a' },
              {
                type: 'text',
                content: value,
                props: { fontWeight: 'bold' }
              },
              { type: 'text', content: 'POAP on' },
              { type: 'text', content: chain }
            ]
          };
        } else if (acc.standardContractType === 'POAP' && acc.method === 'eventId') {
          // owns a POAP
          // Owner of a POAP from event ID ${value} on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: 'Owner of a POAP from event ID' },
              { type: 'text', content: value, props: { fontWeight: 'bold' } },
              { type: 'text', content: 'on' },
              { type: 'text', content: chain }
            ]
          };
        } else if (acc.standardContractType === 'CASK' && acc.method === 'getActiveSubscriptionCount') {
          // Cask powered subscription
          // Cask subscriber to provider ${acc.parameters[1]} for plan ${acc.parameters[2]} on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: `Cask subscriber to provider` },
              { type: 'text', content: acc.parameters[1], props: { fontWeight: 'bold' } },
              { type: 'text', content: `for plan` },
              { type: 'text', content: acc.parameters[2], props: { fontWeight: 'bold' } },
              { type: 'text', content: `on` },
              { type: 'text', content: chain }
            ]
          };
        } else if (acc.standardContractType === 'ERC1155' && acc.method === 'balanceOf') {
          // erc1155 owns an amount of specific tokens
          // Owns ${comparator} ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1]} on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: `Owns` },
              { type: 'text', content: comparator },
              { type: 'text', content: value },
              { type: 'text', content: `of` },
              {
                type: 'text',
                content: tokenName,
                props: { fontWeight: 'bold' }
              },
              { type: 'text', content: `tokens with token id` },
              { type: 'text', content: acc.parameters[1] },
              { type: 'text', content: `on` },
              { type: 'text', content: chain }
            ]
          };
        } else if (acc.standardContractType === 'ERC1155' && acc.method === 'balanceOfBatch') {
          // erc1155 owns an amount of specific tokens from a batch of token ids
          // Owns ${comparator} ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1].split(',').join(' or ')} on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: `Owns` },
              { type: 'text', content: comparator },
              { type: 'text', content: value },
              { type: 'text', content: `of` },
              {
                type: 'text',
                content: tokenName,
                props: { fontWeight: 'bold' }
              },
              { type: 'text', content: `tokens with token id` },
              {
                type: 'text',
                content: `${acc.parameters[1].split(',').join(' or ')}`
              },
              { type: 'text', content: `on` },
              { type: 'text', content: chain }
            ]
          };
        } else if (acc.standardContractType === 'ERC721' && acc.method === 'balanceOf') {
          // any erc721 in collection
          // Owns ${comparator} ${value} of ${tokenName} nft on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: `Owns` },
              { type: 'text', content: comparator },
              { type: 'text', content: value },
              { type: 'text', content: `of` },
              { type: 'text', content: tokenName, props: { fontWeight: 'bold' } },
              { type: 'text', content: `nft on` },
              { type: 'text', content: chain }
            ]
          };
        } else if (acc.standardContractType === 'ERC20' && acc.method === 'balanceOf') {
          // Owns ${comparator} ${balance} of ${tokenName} tokens on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: `Owns` },
              { type: 'text', content: comparator },
              { type: 'text', content: balance },
              { type: 'text', content: `of` },
              { ...etherscanUrl, content: tokenName, props: { fontWeight: 'bold' } },
              { type: 'text', content: `tokens on` },
              { type: 'text', content: chain }
            ]
          };
        } else if (acc.standardContractType === '' && acc.method === 'eth_getBalance') {
          // Owns ${comparator} ${balance} ${tokenSymbol} on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: `Owns` },
              { type: 'text', content: comparator },
              { type: 'text', content: balance },
              { type: 'text', content: tokenSymbol },
              { type: 'text', content: `on` },
              { type: 'text', content: chain }
            ]
          };
        } else if (acc.standardContractType === '' && acc.method === '' && isValidValueAddress) {
          if (myWalletAddress && acc.returnValueTest.value.toLowerCase() === myWalletAddress.toLowerCase()) {
            // Controls your wallet ${shortWalletAddress(myWalletAddress)}
            return {
              image,
              content: [
                { type: 'text', content: `Controls your wallet` },
                {
                  type: 'text',
                  content: shortWalletAddress(myWalletAddress),
                  props: { fontWeight: 'bold' }
                }
              ]
            };
          } else {
            // Controls wallet with address ${shortWalletAddress(value)}
            return {
              image,
              content: [
                { type: 'text', content: `Controls wallet with address` },
                { type: 'text', content: shortWalletAddress(value), props: { fontWeight: 'bold' } }
              ]
            };
          }
        }

        log.error('Unsupported token gate conditions', { conditions: acc });

        // Show a simple error message
        return {
          content: [{ type: 'text', content: 'Oops. something went wrong!' }]
        };
      }

      return undefined;
    })
    .filter(isTruthy);

  return humanReadableConditions || [];
}

export function humanizeConditions(conditions: HumanizeCondition[]) {
  return conditions
    .map((c) => {
      return c.content.map((_c) => _c.content).join(' ');
    })
    .join(' ');
}
