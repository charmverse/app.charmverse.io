import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { v4 } from 'uuid';

import { setForumCategoryNotification } from '../setForumCategoryNotification';

let generated: Awaited<ReturnType<typeof generateUserAndSpace>>;

const categoryId = v4();

beforeAll(async () => {
  generated = await generateUserAndSpace();
});

describe('setForumCategoryNotification()', () => {
  it('Should disable notifications for a category', async () => {
    const result = await setForumCategoryNotification({
      categoryId,
      enabled: false,
      spaceId: generated.space.id,
      userId: generated.user.id
    });

    expect(result).toMatchObject(
      expect.objectContaining<Partial<typeof result>>({
        forumCategories: [categoryId],
        // blacklist is the default
        forumCategoriesMode: 'blacklist'
      })
    );
  });

  it('Should re-enable notifications for a category', async () => {
    const result = await setForumCategoryNotification({
      categoryId,
      enabled: true,
      spaceId: generated.space.id,
      userId: generated.user.id
    });

    expect(result).toMatchObject(
      expect.objectContaining<Partial<typeof result>>({
        forumCategories: [],
        forumCategoriesMode: 'blacklist'
      })
    );
  });
  it('Should re-enable notifications for a category using a whitelist', async () => {
    await prisma.userSpaceNotificationSettings.update({
      where: {
        userId_spaceId: {
          spaceId: generated.space.id,
          userId: generated.user.id
        }
      },
      data: {
        forumCategoriesMode: 'whitelist'
      }
    });

    const result = await setForumCategoryNotification({
      categoryId,
      enabled: true,
      spaceId: generated.space.id,
      userId: generated.user.id
    });

    expect(result).toMatchObject(
      expect.objectContaining<Partial<typeof result>>({
        forumCategories: [categoryId],
        forumCategoriesMode: 'whitelist'
      })
    );
  });
});
