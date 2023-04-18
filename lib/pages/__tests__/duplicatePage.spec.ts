import { v4 as uid } from 'uuid';

import { prisma } from 'db';
import { createPage, generateUserAndSpace } from 'testing/setupDatabase';

import { duplicatePage } from '../duplicatePage';

describe('duplicatePage', () => {
  it('should include permissions from the original page', async () => {
    const { space } = await generateUserAndSpace();
    const pagePermissions = [
      {
        userId: null,
        id: uid(),
        permissionLevel: 'full_access' as const,
        spaceId: space.id
      },
      {
        id: uid(),
        permissionLevel: 'editor' as const,
        userId: space.createdBy
      },
      {
        id: uid(),
        permissionLevel: 'view' as const,
        public: true
      }
    ];
    const pageToDuplicate = await createPage({
      spaceId: space.id,
      createdBy: space.createdBy,
      pagePermissions
    });

    const duplicatedPage = await duplicatePage({ pageId: pageToDuplicate.id, parentId: null, spaceId: space.id });

    const result = await prisma.page.findUniqueOrThrow({
      where: { id: duplicatedPage.rootPageId },
      include: { permissions: true }
    });

    expect(result.permissions.length).toBe(3);

    expect(result.permissions).toEqual(
      expect.arrayContaining(
        pagePermissions.map((perm) =>
          expect.objectContaining({
            ...perm,
            id: expect.any(String)
          })
        )
      )
    );
  });
});
