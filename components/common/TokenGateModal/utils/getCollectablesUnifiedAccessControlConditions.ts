import type { UnifiedAccessControlConditions } from '@lit-protocol/types';
import { getChainById } from 'connectors/chains';

import type { FormValues } from '../hooks/useCollectablesForm';

export function getCollectablesUnifiedAccessControlConditions(
  values: FormValues
): UnifiedAccessControlConditions | undefined {
  const { collectableOption, chain, contract, tokenId, quantity, poapType, poapId, poapName, poapNameMatch } = values;
  const chainName = getChainById(Number(chain))?.litNetwork || 'ethereum';

  if (collectableOption === 'ERC721' && chain && contract) {
    if (tokenId) {
      return [
        {
          conditionType: 'evmBasic' as const,
          contractAddress: contract,
          standardContractType: collectableOption,
          chain: chainName,
          method: 'ownerOf',
          parameters: [tokenId],
          returnValueTest: {
            comparator: '=',
            value: ':userAddress'
          }
        }
      ];
    }

    if (quantity) {
      return [
        {
          conditionType: 'evmBasic' as const,
          contractAddress: contract,
          standardContractType: collectableOption,
          chain: chainName,
          method: 'balanceOf',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '>=',
            value: quantity
          }
        }
      ];
    }
  }
  if (collectableOption === 'ERC1155' && chain && contract && tokenId) {
    return [
      {
        conditionType: 'evmBasic' as const,
        contractAddress: contract,
        standardContractType: collectableOption,
        chain: chainName,
        method: 'balanceOf',
        parameters: [':userAddress', tokenId],
        returnValueTest: {
          comparator: '>=',
          value: '1'
        }
      }
    ];
  }
  if (collectableOption === 'POAP') {
    if (poapType === 'id' && poapId) {
      return [
        {
          conditionType: 'evmBasic',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          standardContractType: collectableOption,
          chain: 'xdai',
          method: 'eventId',
          parameters: [],
          returnValueTest: {
            comparator: '=',
            value: poapId
          }
        },
        {
          operator: 'or'
        },
        {
          conditionType: 'evmBasic',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          standardContractType: collectableOption,
          chain: 'ethereum',
          method: 'eventId',
          parameters: [],
          returnValueTest: {
            comparator: '=',
            value: poapId
          }
        }
      ];
    } else if (poapType === 'name' && poapName && poapNameMatch) {
      return [
        {
          conditionType: 'evmBasic',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          standardContractType: 'POAP',
          chain: 'xdai',
          method: 'tokenURI',
          parameters: [],
          returnValueTest: {
            comparator: poapNameMatch === 'contains' ? poapNameMatch : '=',
            value: poapName
          }
        },
        {
          operator: 'or'
        },
        {
          conditionType: 'evmBasic',
          contractAddress: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
          standardContractType: 'POAP',
          chain: 'ethereum',
          method: 'tokenURI',
          parameters: [],
          returnValueTest: {
            comparator: poapNameMatch === 'contains' ? poapNameMatch : '=',
            value: poapName
          }
        }
      ];
    }
  }
}
