import type { SubscriptionTier } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { PermissionsApiClient } from '@packages/core/permissions';

import { getPermissionsClient } from '../client';
import { PublicPermissionsClient } from '../freeClient';
import { PermissionsApiClientWithPermissionsSwitch } from '../overridenPermissionsApiClient';

describe('getPermissionsClient', () => {
  it('should return the free client for a free space', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    const clientInfo = await getPermissionsClient({
      resourceId: space.id,
      resourceIdType: 'space'
    });

    expect(clientInfo.client).toBeInstanceOf(PublicPermissionsClient);
    expect(clientInfo.type).toBe('free');
    expect(clientInfo.spaceId).toBe(space.id);
  });

  it('should return the premium client for a space with pro, cancelled or enterprise tier', async () => {
    const statuses: SubscriptionTier[] = ['community', 'cancelled', 'enterprise'];

    for (const status of statuses) {
      const { space } = await testUtilsUser.generateUserAndSpace({
        spacePaidTier: status
      });
      // Make sure this was actually passed through
      expect(space.paidTier).toEqual(status);

      const clientInfo = await getPermissionsClient({
        resourceId: space.id,
        resourceIdType: 'space'
      });

      expect(clientInfo.client).toBeInstanceOf(PermissionsApiClient);
      expect(clientInfo.type).toBe('premium');
      expect(clientInfo.spaceId).toBe(space.id);
    }
  });
});
