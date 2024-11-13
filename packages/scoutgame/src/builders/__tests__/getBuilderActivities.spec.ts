import { mockBuilder, mockScout, mockBuilderNft } from '@packages/scoutgame/testing/database';

import { getBuilderActivities } from '../getBuilderActivities';

describe('getBuilderActivities', () => {
  it('should return builder activities from different seasons', async () => {
    const builder = await mockBuilder();
    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      owners: [scout],
      season: '2023-06'
    });
    await mockBuilderNft({
      builderId: builder.id,
      owners: [scout],
      season: '2023-01'
    });
    const result = await getBuilderActivities({ builderId: builder.id, limit: 5 });

    expect(result).toHaveLength(2);
  });
});
