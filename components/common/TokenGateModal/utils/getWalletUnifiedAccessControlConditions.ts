import type { AccessControlCondition } from 'lib/tokenGates/interfaces';

import type { FormValues } from '../hooks/useWalletForm';

export function getWalletUnifiedAccessControlConditions(values: FormValues): AccessControlCondition[] | undefined {
  const { contract } = values;

  return [
    {
      condition: 'evm',
      contractAddress: contract,
      chain: 1,
      method: 'ownerOf',
      type: 'Wallet',
      tokenIds: [],
      quantity: '1'
    }
  ];
}
