import type { AccessControlCondition } from '@packages/lib/tokenGates/interfaces';

import type { FormValues } from '../hooks/useCollectablesForm';

export function getCollectablesAccessControlConditions(values: FormValues): AccessControlCondition[] | undefined {
  const { collectableOption, chain, contract, tokenId, quantity, poapType, poapId, poapName, poapNameMatch } = values;
  const chainId = Number(chain);

  if (collectableOption === 'ERC721' && chain && contract) {
    if (tokenId) {
      return [
        {
          condition: 'evm',
          contractAddress: contract,
          type: collectableOption,
          chain: chainId,
          method: 'ownerOf',
          tokenIds: [tokenId],
          quantity: '1'
        }
      ];
    }

    if (quantity) {
      return [
        {
          condition: 'evm',
          contractAddress: contract,
          type: collectableOption,
          chain: chainId,
          method: 'balanceOf',
          tokenIds: [],
          quantity
        }
      ];
    }
  }
  if (collectableOption === 'ERC1155' && chain && contract && tokenId) {
    return [
      {
        condition: 'evm',
        contractAddress: contract,
        type: collectableOption,
        chain: chainId,
        method: 'balanceOf',
        tokenIds: [tokenId],
        quantity: '1'
      }
    ];
  }
  if (collectableOption === 'POAP') {
    if (poapType === 'id' && poapId) {
      return [
        {
          condition: 'evm',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          type: collectableOption,
          chain: 100,
          method: 'eventId',
          tokenIds: [poapId],
          quantity: '1'
        },
        {
          condition: 'evm',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          type: collectableOption,
          chain: 1,
          method: 'eventId',
          tokenIds: [poapId],
          quantity: '1'
        }
      ];
    } else if (poapType === 'name' && poapName && poapNameMatch) {
      return [
        {
          condition: 'evm',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          type: 'POAP',
          chain: 100,
          method: 'eventName',
          tokenIds: [poapName],
          quantity: '1'
        },
        {
          condition: 'evm',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          type: 'POAP',
          chain: 1,
          method: 'eventName',
          tokenIds: [poapName],
          quantity: '1'
        }
      ];
    }
  }
  if (collectableOption === 'Unlock' && contract) {
    return [
      {
        condition: 'evm',
        contractAddress: contract,
        type: collectableOption,
        chain: chainId,
        method: 'getHasValidKey',
        tokenIds: [],
        quantity: '1'
      }
    ];
  }
  if (collectableOption === 'Hypersub' && contract) {
    return [
      {
        condition: 'evm',
        contractAddress: contract,
        type: collectableOption,
        chain: chainId,
        method: 'balanceOf',
        tokenIds: [],
        quantity: '1'
      }
    ];
  }
}
