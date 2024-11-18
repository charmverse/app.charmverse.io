import { mockBuilder, mockScout, mockNFTPurchaseEvent } from '@packages/scoutgame/testing/database';
import { mockSeason } from '@packages/scoutgame/testing/generators';

import { getNewScouts } from '../getNewScouts';

describe('getNewScouts', () => {
  it('should retrieve a scout that signed up a long time ago', async () => {
    const mockWeek = '2023-W02'; // some unique week
    const builder = await mockBuilder({ createNft: true });
    const scout = await mockScout({ createdAt: new Date(2000, 1, 1) });

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: mockWeek, season: mockSeason });

    const scouts = await getNewScouts({ week: mockWeek, season: mockSeason });

    expect(scouts).toHaveLength(1);
  });

  it('should not retrieve a scout that purchased an NFT previously', async () => {
    const mockWeek = '2023-W04'; // some unique week
    const builder = await mockBuilder({ createNft: true });
    const scout = await mockScout({ createdAt: new Date(2000, 1, 1) });

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: '2023-W03', season: mockSeason });
    const scouts = await getNewScouts({ week: mockWeek, season: mockSeason });

    expect(scouts).toHaveLength(0);
  });

  it('should retrieve a scout even if they purchased another NFT later', async () => {
    const mockWeek = '2023-W04'; // some unique week
    const builder = await mockBuilder({ createNft: true });
    const scout = await mockScout({ createdAt: new Date(2000, 1, 1) });

    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: mockWeek, season: mockSeason });
    await mockNFTPurchaseEvent({ builderId: builder.id, scoutId: scout.id, week: '2023-W06', season: mockSeason });

    const scouts = await getNewScouts({ week: mockWeek, season: mockSeason });

    expect(scouts).toHaveLength(1);
  });
});
