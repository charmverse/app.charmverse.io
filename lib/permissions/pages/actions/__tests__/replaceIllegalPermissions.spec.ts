/* eslint-disable camelcase, @typescript-eslint/no-non-null-assertion */

import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { replaceIllegalPermissions } from '../replaceIllegalPermissions';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

/**
 * Generates a tree where all pages inherit 1 space / full_access from root_1 (except root 2, which is standalone)
 * Each test can then fuzz the tree permissions state
 */
async function generateTreeWithSpaceFullAccess ({ userId, spaceId }: { userId: string, spaceId: string }): Promise<{
  root_1: IPageWithPermissions;
  root_2: IPageWithPermissions;
  page_1_1: IPageWithPermissions;
  page_1_1_1: IPageWithPermissions;
  page_1_1_1_1: IPageWithPermissions;
}> {
  const root_1 = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    title: 'Root 1',
    parentId: null
  });

  root_1.permissions.push(await prisma.pagePermission.create({
    data: {
      page: {
        connect: {
          id: root_1.id
        }
      },
      permissionLevel: 'full_access',
      space: {
        connect: {
          id: space.id
        }
      }
    },
    include: {
      sourcePermission: true
    }
  }));

  const rootPermissionId = root_1.permissions[0].id;

  const root_2 = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    title: 'Root 2',
    parentId: null
  });

  root_2.permissions.push(await prisma.pagePermission.create({
    data: {
      page: {
        connect: {
          id: root_2.id
        }
      },
      permissionLevel: 'full_access',
      space: {
        connect: {
          id: space.id
        }
      }
    },
    include: {
      sourcePermission: true
    }
  }));

  const page_1_1 = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    title: 'Page 1.1',
    parentId: root_1.id
  });

  page_1_1.permissions.push(await prisma.pagePermission.create({
    data: {
      page: {
        connect: {
          id: page_1_1.id
        }
      },
      permissionLevel: 'full_access',
      space: {
        connect: {
          id: space.id
        }
      },
      sourcePermission: {
        connect: {
          id: rootPermissionId
        }
      }
    },
    include: {
      sourcePermission: true
    }
  }));

  const page_1_1_1 = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    title: 'Page 1.1.1',
    parentId: page_1_1.id
  });

  page_1_1_1.permissions.push(await prisma.pagePermission.create({
    data: {
      page: {
        connect: {
          id: page_1_1_1.id
        }
      },
      permissionLevel: 'full_access',
      space: {
        connect: {
          id: space.id
        }
      },
      sourcePermission: {
        connect: {
          id: rootPermissionId
        }
      }
    },
    include: {
      sourcePermission: true
    }
  }));

  const page_1_1_1_1 = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    title: 'Page 1.1.1',
    parentId: page_1_1_1.id
  });

  page_1_1_1_1.permissions.push(await prisma.pagePermission.create({
    data: {
      page: {
        connect: {
          id: page_1_1_1_1.id
        }
      },
      permissionLevel: 'full_access',
      space: {
        connect: {
          id: space.id
        }
      },
      sourcePermission: {
        connect: {
          id: rootPermissionId
        }
      }
    },
    include: {
      sourcePermission: true
    }
  }));

  return {
    root_1,
    root_2,
    page_1_1,
    page_1_1_1,
    page_1_1_1_1
  };
}

describe('replaceIllegalPermissions', () => {
  it('should reset the permissions of a tree to a correct state by dropping references to inherited permissions from outside the tree, establishing inheritance if possible', async () => {
    const { page_1_1, page_1_1_1, page_1_1_1_1, root_1, root_2 } = await generateTreeWithSpaceFullAccess({
      userId: user.id, spaceId: space.id
    });

    // Put tree in wrong state by making pages inherit from root 2
    await prisma.pagePermission.updateMany({
      where: {
        OR: [page_1_1, page_1_1_1, page_1_1_1_1].map(page => {
          return {
            pageId: page.id
          };
        })
      },
      data: {
        inheritedFromPermission: root_2.permissions[0].id
      }
    });

    const rootFullAccessPermission = root_1.permissions[0];

    await replaceIllegalPermissions({ pageId: page_1_1_1.id });

    const [page_1_1_afterUpdate, page_1_1_1_afterUpdate, page_1_1_1_1_afterUpdate] = await (Promise.all([
      getPage(page_1_1.id),
      getPage(page_1_1_1.id),
      getPage(page_1_1_1_1.id)
    ]) as Promise<IPageWithPermissions[]>);

    // Everything should inherit from the root
    expect(page_1_1_afterUpdate.permissions[0].inheritedFromPermission).toBe(rootFullAccessPermission.id);
    expect(page_1_1_1_afterUpdate.permissions[0].inheritedFromPermission).toBe(rootFullAccessPermission.id);
    expect(page_1_1_1_1_afterUpdate.permissions[0].inheritedFromPermission).toBe(rootFullAccessPermission.id);

  });

  it('should make the target page the source for children who were previously inheriting from elsewhere if the target page has less permissions than its parent, and the parent page permission is not in an erroneous inheritance state', async () => {

    const { page_1_1, page_1_1_1, page_1_1_1_1, root_1, root_2 } = await generateTreeWithSpaceFullAccess({
      userId: user.id, spaceId: space.id
    });

    await prisma.pagePermission.updateMany({
      where: {
        OR: [page_1_1_1, page_1_1_1_1].map(page => {
          return {
            pageId: page.id
          };
        })
      },
      data: {
        inheritedFromPermission: root_2.permissions[0].id
      }
    });

    await prisma.pagePermission.create({
      data: {
        page: {
          connect: {
            id: page_1_1.id
          }
        },
        permissionLevel: 'full_access',
        user: {
          connect: {
            id: user.id
          }
        }
      },
      include: {
        sourcePermission: true
      }
    });

    await replaceIllegalPermissions({ pageId: page_1_1_1.id });

    const [page_1_1_1_afterUpdate, page_1_1_1_1_afterUpdate] = await (Promise.all([
      getPage(page_1_1_1.id),
      getPage(page_1_1_1_1.id)
    ]) as Promise<IPageWithPermissions[]>);

    expect(page_1_1_1_afterUpdate.permissions[0].inheritedFromPermission).toBe(null);

    expect(page_1_1_1_1_afterUpdate.permissions[0].inheritedFromPermission).toBe(page_1_1_1_afterUpdate.permissions[0].id);
  });

});
