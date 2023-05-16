import { prisma } from '@charmverse/core';

import { generateUserAndSpace } from 'testing/setupDatabase';

import { setHiddenFeatures } from '../setHiddenFeatures';

describe('setHiddenFeatures', () => {
  it('should update the list of blocked features in the space', async () => {
    const { space } = await generateUserAndSpace();

    await setHiddenFeatures({
      spaceId: space.id,
      hiddenFeatures: ['bounties']
    });

    const afterUpdate = await prisma.space.findUnique({
      where: {
        id: space.id
      }
    });

    expect(afterUpdate?.hiddenFeatures.length).toBe(1);
    expect(afterUpdate?.hiddenFeatures[0]).toBe('bounties');
    // Perform second setter to make sure this is deterministic
    await setHiddenFeatures({
      spaceId: space.id,
      hiddenFeatures: ['forum']
    });

    const afterSecondUpdate = await prisma.space.findUnique({
      where: {
        id: space.id
      }
    });

    expect(afterSecondUpdate?.hiddenFeatures.length).toBe(1);
    expect(afterSecondUpdate?.hiddenFeatures[0]).toBe('forum');
  });
});
