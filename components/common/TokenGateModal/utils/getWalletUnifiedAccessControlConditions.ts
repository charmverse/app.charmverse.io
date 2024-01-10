import type { UnifiedAccessControlConditions } from '@lit-protocol/types';

import type { FormValues } from '../hooks/useWalletForm';

export function getWalletUnifiedAccessControlConditions(
  values: FormValues
): UnifiedAccessControlConditions | undefined {
  const { contract } = values;

  return [
    {
      conditionType: 'evmBasic',
      contractAddress: '',
      standardContractType: '',
      chain: 'ethereum',
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: contract
      }
    }
  ];
}
