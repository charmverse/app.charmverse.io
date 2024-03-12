import { prisma } from '@charmverse/core/prisma-client';

import { addCharms } from 'lib/charms/addCharms';
import { getSpacesCharmsStatus } from 'lib/charms/getSpacesCharmsStatus';
import { generateUserAndSpace } from 'testing/setupDatabase';

describe('getSpacesCharmsStatus', () => {
  it("retrieves status of charms for user's spaces", async () => {
    const { user, space } = await generateUserAndSpace({ isAdmin: true });
    await prisma.blockCount.create({ data: { count: 120000, spaceId: space.id, details: {} } });

    await addCharms({ recipient: { spaceId: space.id }, amount: 5 });
    const details = await getSpacesCharmsStatus(user.id);

    expect(details[0].spaceId).toBe(space.id);
    expect(details[0].balance).toBe(5);
    // 120 - 30 free block quota = 90 blocks needed
    expect(details[0].balanceNeeded).toBe(90);
  });
});
