import { prisma } from '@charmverse/core/prisma-client';
import { mockBuilder, mockNFTPurchaseEvent } from '@packages/scoutgame/testing/database';

import { getBuilderActivities } from '../getBuilderActivities';

describe('getBuilderActivities', () => {
  it('should return builder activities from different seasons', async () => {
    const builder = await mockBuilder();
    const scout = await mockBuilder();
    await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: scout.id,
      season: '2023-06'
    });
    await mockNFTPurchaseEvent({
      builderId: builder.id,
      scoutId: scout.id,
      season: '2023-01'
    });
    const result = await getBuilderActivities({ builderId: builder.id, take: 5 });

    expect(result).toHaveLength(2);
  });
});
