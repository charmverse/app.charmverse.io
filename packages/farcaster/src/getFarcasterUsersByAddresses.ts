import { GET } from '@packages/utils/http';

import { NEYNAR_API_BASE_URL, NEYNAR_API_KEY } from './constants';
import type { FarcasterUser } from './interfaces';

export function getFarcasterUsersByAddresses({
  addresses,
  addressTypes
}: {
  addresses: string[];
  addressTypes?: ('custody_address' | 'verified_address')[];
}) {
  return GET<{ [walletAddress: string]: FarcasterUser[] }>(
    `${NEYNAR_API_BASE_URL}/user/bulk-by-address`,
    { addresses: addresses.join(','), address_types: addressTypes?.join(',') ?? null },
    {
      headers: {
        api_key: NEYNAR_API_KEY
      }
    }
  );
}
