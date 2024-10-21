import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { generateUserAndSpace, createPage } from 'testing/setupDatabase';

import { mergeProfiles } from '../mergeProfiles';

describe('mergeProfiles', () => {
  it('should update page ownership and delete secondary profile', async () => {
    const primaryUser = await generateUserAndSpace();
    const secondaryUser = await generateUserAndSpace();

    // Create a test page owned by the secondary user
    const testPage = await createPage({
      createdBy: secondaryUser.user.id,
      spaceId: secondaryUser.space.id
    });

    // Merge profiles
    await mergeProfiles({
      primaryProfileId: primaryUser.user.id,
      secondaryProfileId: secondaryUser.user.id
    });

    // Verify page ownership was updated
    const updatedPage = await prisma.page.findUnique({
      where: { id: testPage.id }
    });
    expect(updatedPage?.createdBy).toBe(primaryUser.user.id);

    // Verify secondary profile was deleted
    const deletedUser = await prisma.user.findUnique({
      where: { id: secondaryUser.user.id }
    });
    expect(deletedUser?.deletedAt).not.toBeNull();
  });
});
