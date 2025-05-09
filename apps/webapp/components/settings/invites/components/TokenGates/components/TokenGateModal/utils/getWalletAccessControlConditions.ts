import type { AccessControlCondition } from '@packages/lib/tokenGates/interfaces';

import type { FormValues } from '../hooks/useWalletForm';

export function getWalletAccessControlConditions(values: FormValues): AccessControlCondition[] | undefined {
  const { contract } = values;

  return [
    {
      condition: 'evm',
      contractAddress: '',
      chain: 1,
      method: 'ownerOf',
      type: 'Wallet',
      tokenIds: [contract],
      quantity: '1'
    }
  ];
}
