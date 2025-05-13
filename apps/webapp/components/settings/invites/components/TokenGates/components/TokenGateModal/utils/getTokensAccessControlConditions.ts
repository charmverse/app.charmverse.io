import { parseEther } from 'viem';

import type { AccessControlCondition } from '@packages/lib/tokenGates/interfaces';

import type { FormValues } from '../hooks/useTokensForm';

export function getTokensAccessControlConditions(values: FormValues): AccessControlCondition[] | undefined {
  const { chain, contract, method, quantity, check } = values;
  const chainId = Number(chain);
  const amount = parseEther(quantity).toString();

  if (check === 'customToken' && contract) {
    return [
      {
        chain: chainId,
        condition: 'evm',
        contractAddress: contract,
        method: 'balanceOf',
        type: 'ERC20',
        tokenIds: [],
        quantity: amount
      }
    ];
  }

  if (check === 'customContractMethod' && contract) {
    return [
      {
        chain: chainId,
        condition: 'evm',
        contractAddress: contract,
        method: method!,
        type: 'ContractMethod',
        tokenIds: [],
        quantity: amount
      }
    ];
  }

  if (check === 'token') {
    return [
      {
        chain: chainId,
        condition: 'evm',
        contractAddress: '',
        type: 'ERC20',
        method: 'balanceOf',
        tokenIds: [],
        quantity: amount
      }
    ];
  }
}
