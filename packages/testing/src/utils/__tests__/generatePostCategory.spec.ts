import type { PostCategory } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { generateUserAndSpace } from '../../setupDatabase';
import { generatePostCategory } from '../forums';

describe('generatePostCategory', () => {
  // This assertion is important because it ensures that consumer tests can set up the state of permissions in a deterministic way, without risk of side effects from updates to default permissions logic used in the real createPostCategory method.
  it('should create a post category without any permissions', async () => {
    const { space } = await generateUserAndSpace();
    const postCategory = await generatePostCategory({ spaceId: space.id, name: 'Example' });

    expect(postCategory).toMatchObject(
      expect.objectContaining<Partial<PostCategory>>({
        id: expect.any(String),
        name: 'Example',
        path: expect.any(String),
        spaceId: space.id
      })
    );

    const permissions = await prisma.postCategoryPermission.findMany({
      where: {
        postCategoryId: postCategory.id
      }
    });

    expect(permissions.length).toBe(0);
  });
});
