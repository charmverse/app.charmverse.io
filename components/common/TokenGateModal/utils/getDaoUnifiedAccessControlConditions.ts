import type { AccessControlCondition } from 'lib/tokenGates/interfaces';

import type { FormValues } from '../hooks/useDaoForm';

export function getDaoUnifiedAccessControlConditions(values: FormValues): AccessControlCondition[] | undefined {
  const { chain = '1', contract = '', check, guild = '' } = values;
  const chainId = Number(chain);

  if (check === 'guild') {
    return [
      {
        condition: 'evm',
        contractAddress: '',
        type: 'Guildxyz',
        chain: 1,
        method: 'members',
        tokenIds: [guild],
        quantity: '1'
      }
    ];
  } else if (check === 'moloch') {
    return [
      {
        condition: 'evm',
        contractAddress: contract,
        type: 'MolochDAOv2.1',
        chain: chainId,
        method: 'members',
        tokenIds: [],
        quantity: '1'
      }
    ];
  } else if (check === 'builder') {
    return [
      {
        condition: 'evm' as const,
        contractAddress: contract,
        type: 'ERC721',
        chain: chainId,
        method: 'balanceOf',
        tokenIds: [],
        quantity: '1'
      }
    ];
  }

  return [];
}
