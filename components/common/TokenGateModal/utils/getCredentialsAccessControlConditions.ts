import type { AccessControlCondition } from 'lib/tokenGates/interfaces';

import type { FormValues } from '../hooks/useCredentialsForm';

export function getCredentialsAccessControlConditions(values: FormValues): AccessControlCondition[] {
  const { score = 0 } = values;

  return [
    {
      condition: 'evm',
      contractAddress: '',
      type: 'GitcoinPassport',
      chain: 1,
      method: 'members',
      tokenIds: [],
      quantity: String(score)
    }
  ];
}
