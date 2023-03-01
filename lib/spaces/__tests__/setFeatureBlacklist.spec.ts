import { prisma } from 'db';
import { generateUserAndSpace } from 'testing/setupDatabase';

import { setFeatureBlacklist } from '../setFeatureBlacklist';

describe('setFeatureBlacklist', () => {
  it('should update the list of blocked features in the space', async () => {
    const { space } = await generateUserAndSpace();

    await setFeatureBlacklist({
      spaceId: space.id,
      featureBlacklist: ['bounties']
    });

    const afterUpdate = await prisma.space.findUnique({
      where: {
        id: space.id
      }
    });

    expect(afterUpdate?.featureBlacklist.length).toBe(1);
    expect(afterUpdate?.featureBlacklist[0]).toBe('bounties');
    // Perform second setter to make sure this is deterministic
    await setFeatureBlacklist({
      spaceId: space.id,
      featureBlacklist: ['forum']
    });

    const afterSecondUpdate = await prisma.space.findUnique({
      where: {
        id: space.id
      }
    });

    expect(afterSecondUpdate?.featureBlacklist.length).toBe(1);
    expect(afterSecondUpdate?.featureBlacklist[0]).toBe('forum');
  });
});
