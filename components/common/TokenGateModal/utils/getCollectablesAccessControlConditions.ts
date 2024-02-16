import type { AccessControlCondition } from 'lib/tokenGates/interfaces';

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
          quantity: '1',
          comparator: '='
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
          comparator: '>=',
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
        comparator: '=',
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
          comparator: '=',
          quantity: '1'
        },
        {
          condition: 'evm',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          type: collectableOption,
          chain: 1,
          method: 'eventId',
          tokenIds: [poapId],
          comparator: '=',
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
          comparator: poapNameMatch === 'contains' ? poapNameMatch : '=',
          quantity: '1'
        },
        {
          condition: 'evm',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          type: 'POAP',
          chain: 1,
          method: 'eventName',
          tokenIds: [poapName],
          comparator: poapNameMatch === 'contains' ? poapNameMatch : '=',
          quantity: '1'
        }
      ];
    }
  }
}
