import type { AccessControlCondition } from '@packages/lib/tokenGates/interfaces';

import { hatsProtocolContractAddress, type FormValues } from '../hooks/useCommunitiesForm';

export function getCommunitiesAccessControlConditions(values: FormValues): AccessControlCondition[] | undefined {
  const { chain = '1', contract = '', check, guild = '', tokenId } = values;
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
  } else if (check === 'hats' && tokenId) {
    return [
      {
        condition: 'evm' as const,
        contractAddress: hatsProtocolContractAddress,
        type: 'Hats',
        chain: chainId,
        method: 'balanceOf',
        tokenIds: [tokenId],
        quantity: '1'
      }
    ];
  }

  return [];
}
