import type { UnifiedAccessControlConditions } from '@lit-protocol/types';
import { parseEther } from 'viem';

import type { FormValues } from '../hooks/useTokensForm';

export function getTokensUnifiedAccessControlConditions(
  values: FormValues
): UnifiedAccessControlConditions | undefined {
  const { chain, contract, quantity, check } = values;
  const amount = parseEther(quantity).toString();

  if (check === 'customToken') {
    return [
      {
        chain,
        conditionType: 'evmBasic',
        contractAddress: contract,
        method: 'balanceOf',
        standardContractType: 'ERC20',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '>=',
          value: amount
        }
      }
    ];
  }

  if (check === 'token') {
    return [
      {
        chain,
        conditionType: 'evmBasic',
        contractAddress: '',
        standardContractType: '',
        method: 'eth_getBalance',
        parameters: [':userAddress', 'latest'],
        returnValueTest: {
          comparator: '>=',
          value: amount
        }
      }
    ];
  }
}
