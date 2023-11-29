import type { UnifiedAccessControlConditions } from '@lit-protocol/types';

import type { FormValues } from '../hooks/useWalletForm';

export function getWalletUnifiedAccessControlConditions(
  values: FormValues
): UnifiedAccessControlConditions | undefined {
  const { chain, contract } = values;

  return [
    {
      conditionType: 'evmBasic',
      contractAddress: '',
      standardContractType: '',
      chain,
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: contract
      }
    }
  ];
}
