import { v4 } from 'uuid';

import { prisma } from 'db';
import { defaultPostCategories } from 'lib/forums/categories/generateDefaultPostCategories';

import { createWorkspace } from '../createWorkspace';

describe('createWorkspace', () => {
  it('should create default post categories for the workspace', async () => {
    const user = await prisma.user.create({ data: { username: 'demo-user' } });

    const newWorkspace = await createWorkspace({
      userId: user.id,
      spaceData: {
        name: `Name-${v4()}`,
        domain: `domain-${v4()}`,
        author: {
          connect: {
            id: user.id
          }
        },
        updatedBy: user.id
      }
    });

    const categories = await prisma.postCategory.findMany({
      where: {
        spaceId: newWorkspace.id
      }
    });

    expect(categories).toHaveLength(defaultPostCategories.length);

    expect(categories.every((c) => defaultPostCategories.includes(c.name))).toBe(true);
  });
});
