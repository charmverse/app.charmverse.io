import type { UnifiedAccessControlConditions } from '@lit-protocol/types';

import type { FormValues } from '../hooks/useWalletForm';

export function getDaoUnifiedAccessControlConditions(values: FormValues): UnifiedAccessControlConditions | undefined {
  const { chain, contract } = values;

  return [
    {
      conditionType: 'evmBasic',
      contractAddress: contract,
      standardContractType: 'MolochDAOv2.1',
      chain,
      method: 'members',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: 'true'
      }
    }
  ];
}
