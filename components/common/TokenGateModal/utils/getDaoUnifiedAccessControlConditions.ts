import type { UnifiedAccessControlConditions } from '@lit-protocol/types';
import { getChainById } from 'connectors/chains';

import type { FormValues } from '../components/TokenGateDao';

export function getDaoUnifiedAccessControlConditions(values: FormValues): UnifiedAccessControlConditions | undefined {
  const { chain, contract, check } = values;
  const chainName = getChainById(Number(chain))?.litNetwork || 'ethereum';

  if (check === 'moloch') {
    return [
      {
        conditionType: 'evmBasic',
        contractAddress: contract,
        standardContractType: 'MolochDAOv2.1',
        chain: chainName,
        method: 'members',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: 'true'
        }
      }
    ];
  } else if (check === 'builder') {
    return [
      {
        conditionType: 'evmBasic' as const,
        contractAddress: contract,
        standardContractType: 'ERC721',
        chain: 'ethereum',
        method: 'balanceOf',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '>=',
          value: '1'
        }
      }
    ];
  }

  return [];
}
