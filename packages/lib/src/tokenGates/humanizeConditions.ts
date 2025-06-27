import type { TypographyProps } from '@mui/material/Typography';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { log } from '@packages/core/log';
import { shortWalletAddress } from '@packages/utils/blockchain';
import { formatEther } from 'viem';

import type { Operator, TokenGate } from './interfaces';

type HumanizeConditionsContentType = 'text' | 'link';

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

export function humanizeConditionsData(conditions: TokenGate['conditions']): HumanizeCondition[] {
  const humanReadableConditions = conditions.accessControlConditions.map<HumanizeCondition>((acc) => {
    const chainDetails = getChainById(Number(acc.chain));
    const tokenSymbol = chainDetails?.viem?.nativeCurrency.symbol || chainDetails?.nativeCurrency.symbol;
    const quantity = acc.quantity;
    const balance = Number(quantity) && Number(quantity) % 1 === 0 ? formatEther(BigInt(quantity)) : quantity;
    const image = acc.image;
    const tokenNameOrEtherscanUrl: HumanizeConditionsContent = acc.name
      ? { type: 'text', content: acc.name || '', props: { fontWeight: 'bold' } }
      : {
          type: 'link',
          url: `${chainDetails?.blockExplorerUrls[0]}/address/${acc.contractAddress}`,
          content: shortWalletAddress(acc.contractAddress),
          props: { fontWeight: 'bold' }
        };
    const chain = chainDetails?.chainName || 'Ethereum';

    switch (acc.type) {
      case 'MolochDAOv2.1': {
        // MolochDAOv2.1 membership
        // Is a member of the DAO at ${shortWalletAddress(acc.contractAddress)}
        return {
          image,
          content: [{ type: 'text', content: `Is a member of the DAO at` }, { ...tokenNameOrEtherscanUrl }]
        };
      }
      case 'ERC721': {
        if (acc.contractAddress === '0x22C1f6050E56d2876009903609a2cC3fEf83B415') {
          // For POAP main contract where the user owns at least 1 poap
          // Owns any POAP
          return {
            image,
            content: [{ type: 'text', content: `Owns any POAP` }]
          };
        }

        if (acc.tokenIds.at(0)) {
          // Specific ERC721
          // Owner of ${tokenName} NFT with token id ${id} on ${chain}
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
        }

        // any erc721 in collection
        // Owns at least ${quantity} of ${tokenName} NFT on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: `Owns at least` },
            { type: 'text', content: acc.quantity },
            { type: 'text', content: `of` },
            { ...tokenNameOrEtherscanUrl },
            { type: 'text', content: `NFT on` },
            { type: 'text', content: chain }
          ]
        };
      }
      case 'POAP': {
        // Owns a specific POAP
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
      }
      case 'ERC1155': {
        // erc1155 owns an amount of specific tokens
        // Owns ${value} of ${acc.contractAddress} tokens with token id ${acc.parameters[1]} on ${chain}
        return {
          image,
          content: [
            { type: 'text', content: `Owns at least` },
            { type: 'text', content: acc.quantity },
            { type: 'text', content: `of` },
            { ...tokenNameOrEtherscanUrl },
            { type: 'text', content: `tokens with token id` },
            { type: 'text', content: acc.tokenIds.length > 1 ? acc.tokenIds.join(', ') : acc.tokenIds.at(0) || '' },
            { type: 'text', content: `on` },
            { type: 'text', content: chain }
          ]
        };
      }
      case 'ERC20': {
        // Owns at least ${balance} of ${tokenName} tokens on ${chain}
        if (acc.contractAddress) {
          return {
            image,
            content: [
              { type: 'text', content: `Owns at least` },
              { type: 'text', content: balance },
              { type: 'text', content: `of` },
              { ...tokenNameOrEtherscanUrl },
              { type: 'text', content: `tokens on` },
              { type: 'text', content: chain }
            ]
          };
        } else {
          // Owns at least ${balance} of ${tokenSymbol} on ${chain}
          return {
            image,
            content: [
              { type: 'text', content: `Owns at least` },
              { type: 'text', content: balance },
              { type: 'text', content: tokenSymbol || '' },
              { type: 'text', content: `on` },
              { type: 'text', content: chain }
            ]
          };
        }
      }
      case 'ContractMethod': {
        return {
          image,
          content: [
            { ...tokenNameOrEtherscanUrl },
            { type: 'text', content: `returns at least` },
            { type: 'text', content: balance },
            { type: 'text', content: `on` },
            { type: 'text', content: chain }
          ]
        };
      }
      case 'Wallet': {
        // Controls wallet with address ${shortWalletAddress}
        return {
          image,
          content: [
            { type: 'text', content: `Controls wallet with address` },
            { type: 'text', content: shortWalletAddress(acc.tokenIds.at(0) || ''), props: { fontWeight: 'bold' } }
          ]
        };
      }
      case 'Unlock': {
        // Unlock Protocol - ${subscription name}
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
      }
      case 'Hypersub': {
        return {
          image,
          type: acc.type,
          content: [
            { type: 'text', content: 'Hypersub -' },
            {
              type: 'text',
              content: tokenNameOrEtherscanUrl.type === 'text' ? tokenNameOrEtherscanUrl.content : 'Membership'
            }
          ]
        };
      }
      case 'GitcoinPassport': {
        // Gitcoin Passport with a minimum score of ${acc.quantity}
        return {
          image,
          type: acc.type,
          content: [
            { type: 'text', content: 'Gitcoin Passport with a minimum score of' },
            { type: 'text', content: acc.quantity, props: { fontWeight: 600 } }
          ]
        };
      }
      case 'Guildxyz': {
        // Guild.xyz ${guildIdOrUrl}
        return {
          image,
          type: acc.type,
          content: [
            { type: 'text', content: 'Guild.xyz' },
            { type: 'text', content: acc.name || acc.tokenIds.at(0) || '', props: { fontWeight: 600 } }
          ]
        };
      }
      case 'Builder': {
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
      case 'Hats': {
        return {
          image,
          type: acc.type,
          content: [
            { type: 'text', content: 'Hats Protocol Id' },
            {
              type: 'text',
              content: acc.tokenIds.at(0) || '',
              props: { fontWeight: 600 }
            }
          ]
        };
      }
      default: {
        log.error('Unsupported token gate conditions', { conditions: acc });

        return {
          content: [{ type: 'text', content: 'Oops. something went wrong!' }]
        };
      }
    }
  });

  return humanReadableConditions || [];
}

export function humanizeConditions(conditions: HumanizeCondition[], operator: Operator = 'OR') {
  return conditions
    .map((c) => {
      return c.content.map((_c) => _c.content).join(' ');
    })
    .join(` ${operator.toLowerCase()} `);
}
