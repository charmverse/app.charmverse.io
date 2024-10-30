import type { User as FarcasterUserProfileFromNeynar } from '@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster';
import { GET } from '@packages/utils/http';

import { NEYNAR_API_BASE_URL, NEYNAR_API_KEY } from './constants';

export function getFarcasterUsersByAddresses({
  addresses,
  addressTypes
}: {
  addresses: string[];
  addressTypes?: ('custody_address' | 'verified_address')[];
}) {
  return GET<{ [walletAddress: string]: FarcasterUserProfileFromNeynar[] }>(
    `${NEYNAR_API_BASE_URL}/user/bulk-by-address`,
    { addresses: addresses.join(','), address_types: addressTypes?.join(',') ?? null },
    {
      headers: {
        api_key: NEYNAR_API_KEY
      }
    }
  );
}
