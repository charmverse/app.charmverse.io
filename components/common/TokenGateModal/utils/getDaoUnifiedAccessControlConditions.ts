import type { UnifiedAccessControlConditions } from '@lit-protocol/types';
import { getChainById } from 'connectors/chains';

import type { FormValues } from '../components/TokenGateDao';

export function getDaoUnifiedAccessControlConditions(values: FormValues): UnifiedAccessControlConditions | undefined {
  const { chain, contract } = values;
  const chainName = getChainById(Number(chain))?.litNetwork || 'ethereum';

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
}
