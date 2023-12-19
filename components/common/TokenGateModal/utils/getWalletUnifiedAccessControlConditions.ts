import type { UnifiedAccessControlConditions } from '@lit-protocol/types';
import { getChainById } from 'connectors/chains';

import type { FormValues } from '../hooks/useWalletForm';

export function getWalletUnifiedAccessControlConditions(
  values: FormValues
): UnifiedAccessControlConditions | undefined {
  const { chain, contract } = values;
  const chainName = getChainById(Number(chain))?.litNetwork || 'etherum';

  return [
    {
      conditionType: 'evmBasic',
      contractAddress: '',
      standardContractType: '',
      chain: chainName,
      method: '',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '=',
        value: contract
      }
    }
  ];
}
