import { log } from '@charmverse/core/log';
import type { TypographyProps } from '@mui/material/Typography';
import { getChainById } from 'connectors/chains';
import { formatEther, isAddress } from 'viem';

import { shortWalletAddress } from 'lib/utilities/blockchain';
import { isTruthy } from 'lib/utilities/types';

import type { TokenGate } from './interfaces';

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
  type?: string;
  content: HumanizeConditionsContent[];
};

export function humanizeConditionsData(
  conditions: TokenGate['conditions'],
  myWalletAddress?: string
): HumanizeCondition[] {
  const humanReadableConditions = conditions.accessControlConditions
    .map<HumanizeCondition>((acc) => {
      const chainDetails = getChainById(Number(acc.chain));
      const tokenSymbol = chainDetails?.viem.nativeCurrency.symbol;
      const quantity = acc.quantity;
      const balance = Number(quantity) ? formatEther(BigInt(quantity)) : quantity;
      const comparator = humanizeComparator(acc.comparator);
      const isValidValueAddress = isAddress(quantity);
      const image = 'image' in acc && typeof acc.image === 'string' && acc.image ? acc.image : undefined;
      const hasName = 'name' in acc && typeof acc.name === 'string' && !!acc.name;
      const tokenNameOrEtherscanUrl: HumanizeConditionsContent = hasName
        ? { type: 'text', content: acc.name || '', props: { fontWeight: 'bold' } }
        : {
            type: 'link',
            url: `${chainDetails?.blockExplorerUrls[0]}/address/${acc.contractAddress}`,
            content: shortWalletAddress(acc.contractAddress),
            props: { fontWeight: 'bold' }
          };
      const chain = chainDetails?.chainName || 'Ethereum';

      if (acc.type === 'MolochDAOv2.1') {
        // MolochDAOv2.1 membership
        // Is a member of the DAO at ${shortWalletAddress(acc.contractAddress)}
        return {
          image,
          content: [{ type: 'text', content: `Is a member of the DAO at` }, { ...tokenNameOrEtherscanUrl }]
        };
      } else if (acc.type === 'ERC721' && acc.method === 'ownerOf') {
        // Specific ERC721
        // Owner of ${tokenName} NFT on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: 'Owner of' },
            { ...tokenNameOrEtherscanUrl },
            { type: 'text', content: 'NFT' },
            { type: 'text', content: 'with token id' },
            { type: 'text', content: acc.tokenIds.at(0) || '' },
            { type: 'text', content: 'on' },
            { type: 'text', content: chain }
          ]
        };
      } else if (
        acc.type === 'ERC721' &&
        acc.method === 'balanceOf' &&
        acc.contractAddress === '0x22C1f6050E56d2876009903609a2cC3fEf83B415' &&
        acc.quantity === '1'
      ) {
        // @TODO - Check if we can support this
        // for POAP main contract where the user owns at least 1 poap
        // Owns any POAP
        return {
          image,
          content: [{ type: 'text', content: `Owns any POAP` }]
        };
      } else if (acc.type === 'POAP' && acc.method === 'eventName') {
        // owns a POAP
        // Owner of a ${value} POAP on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: 'Owner of a' },
            {
              type: 'text',
              content: acc.tokenIds.at(0) || '',
              props: { fontWeight: 'bold' }
            },
            { type: 'text', content: 'POAP on' },
            { type: 'text', content: chain }
          ]
        };
      } else if (acc.type === 'POAP' && acc.method === 'eventId') {
        // owns a POAP
        // Owner of a POAP from event ID ${value} on ${chain}
        return {
          image,
          type: acc.type,
          content: [
            { type: 'text', content: 'Owner of' },
            { type: 'text', content: acc.tokenIds.at(0) || '', props: { fontWeight: 'bold' } },
            { type: 'text', content: 'POAP Id on' },
            { type: 'text', content: chain }
          ]
        };
      } else if (acc.type === 'ERC1155' && acc.method === 'balanceOf') {
        // erc1155 owns an amount of specific tokens
        // Owns ${comparator} ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1]} on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: acc.quantity },
            { type: 'text', content: `of` },
            { ...tokenNameOrEtherscanUrl },
            { type: 'text', content: `tokens with token id` },
            { type: 'text', content: acc.tokenIds.length > 1 ? acc.tokenIds.join(', ') : acc.tokenIds.at(0) || '' },
            { type: 'text', content: `on` },
            { type: 'text', content: chain }
          ]
        };
      } else if (acc.type === 'ERC1155' && acc.method === 'balanceOfBatch') {
        // erc1155 owns an amount of specific tokens from a batch of token ids
        // Owns ${comparator} ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1].split(',').join(' or ')} on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: acc.quantity },
            { type: 'text', content: `of` },
            { ...tokenNameOrEtherscanUrl },
            { type: 'text', content: 'tokens with token id' },
            {
              type: 'text',
              content: `${acc.tokenIds.length > 1 ? acc.tokenIds.join(', ') : acc.tokenIds.at(0) || ''}`
            },
            { type: 'text', content: 'on' },
            { type: 'text', content: chain }
          ]
        };
      } else if (acc.type === 'ERC721' && acc.method === 'balanceOf') {
        // any erc721 in collection
        // Owns ${comparator} ${value} of ${tokenName} NFT on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: acc.quantity },
            { type: 'text', content: `of` },
            { ...tokenNameOrEtherscanUrl },
            { type: 'text', content: `NFT on` },
            { type: 'text', content: chain }
          ]
        };
      } else if (acc.type === 'ERC20' && acc.method === 'balanceOf') {
        // Owns ${comparator} ${balance} of ${tokenName} tokens on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: balance },
            { type: 'text', content: `of` },
            { ...tokenNameOrEtherscanUrl },
            { type: 'text', content: `tokens on` },
            { type: 'text', content: chain }
          ]
        };
      } else if (acc.type === 'ERC20' && acc.contractAddress === '' && acc.method === 'getBalance') {
        // Owns ${comparator} ${balance} ${tokenSymbol} on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: `Owns` },
            { type: 'text', content: comparator },
            { type: 'text', content: balance },
            { type: 'text', content: tokenSymbol || '' },
            { type: 'text', content: `on` },
            { type: 'text', content: chain }
          ]
        };
      } else if (acc.type === 'Wallet' && acc.method === 'ownerOf' && isValidValueAddress) {
        if (myWalletAddress && acc.tokenIds.some((id) => id.toLowerCase() === myWalletAddress.toLowerCase())) {
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
              { type: 'text', content: shortWalletAddress(acc.tokenIds.at(0) || ''), props: { fontWeight: 'bold' } }
            ]
          };
        }
      } else if (acc.type === 'Unlock') {
        return {
          image,
          type: 'Unlock',
          content: [
            { type: 'text', content: 'Unlock Protocol -' },
            {
              type: 'text',
              content: tokenNameOrEtherscanUrl.type === 'text' ? tokenNameOrEtherscanUrl.content : 'Lock'
            }
          ]
        };
      } else if (acc.type === 'Hypersub') {
        return {
          image,
          type: 'Hypersub',
          content: [
            { type: 'text', content: 'Hypersub -' },
            {
              type: 'text',
              content: tokenNameOrEtherscanUrl.type === 'text' ? tokenNameOrEtherscanUrl.content : 'Membership'
            }
          ]
        };
      } else if (acc.type === 'Builder') {
        return {
          image,
          type: 'Builder DAO',
          content: [
            { type: 'text', content: 'Builder -' },
            {
              type: 'text',
              content: tokenNameOrEtherscanUrl.type === 'text' ? tokenNameOrEtherscanUrl.content : 'Membership'
            }
          ]
        };
      }

      log.error('Unsupported token gate conditions', { conditions: acc });

      return {
        content: [{ type: 'text', content: 'Oops. something went wrong!' }]
      };
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
