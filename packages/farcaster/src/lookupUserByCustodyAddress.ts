import type { User as FarcasterUserProfileFromNeynar } from '@neynar/nodejs-sdk/build/neynar-api/v2/openapi-farcaster';
import { GET } from '@packages/utils/http';

import { NEYNAR_API_BASE_URL, NEYNAR_API_KEY } from './constants';

export function lookupUserByCustodyAddress(custodyAddress: string): Promise<FarcasterUserProfileFromNeynar> {
  return GET<{ user: FarcasterUserProfileFromNeynar }>(
    `${NEYNAR_API_BASE_URL}/user/custody-address`,
    { custody_address: custodyAddress },
    {
      headers: {
        api_key: NEYNAR_API_KEY
      }
    }
  ).then(({ user }) => user);
}
