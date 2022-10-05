import type { Page, PagePermission, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { IPagePermissionWithSource } from 'lib/permissions/pages';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { IPageWithPermissions } from '../../interfaces';
import { getPage } from '../getPage';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('getPage', () => {
  it('should return a page queried by its ID', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: page.id,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] }
    });

    const foundPage = await getPage(childPage.id);

    expect(foundPage).toEqual <Page>(
      expect.objectContaining<Partial<Page>>({
        id: expect.stringMatching(childPage.id),
        parentId: expect.stringMatching(page.id),
        updatedBy: expect.stringMatching(user.id),
        createdBy: expect.stringMatching(user.id),
        index: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: expect.any(String),
        path: expect.any(String),
        content: expect.any(Object),
        contentText: expect.any(String),
        type: expect.any(String),
        spaceId: expect.stringMatching(space.id)
      })
    );
  });

  it('should allow looking up a page by its path + spaceId', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      path: 'My example path'
    });

    const foundPage = await getPage(page.path, page.spaceId as string);

    expect(foundPage).toEqual <Page>(
      expect.objectContaining<Partial<Page>>({
        id: page.id,
        path: page.path,
        spaceId: page.spaceId
      })
    );
  });

  it('should return null if a path but no spaceId is provided', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      path: 'My example path'
    });

    const foundPage = await getPage(page.path);
  });

  it('should return null if the page does not exist', async () => {
    const foundPage = await getPage(v4());
    expect(foundPage).toBe(null);
  });

  it('should return all permissions for a page, and which permissions they inherit from', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: page.id
    });

    const source = await prisma.pagePermission.create({
      data: {
        permissionLevel: 'full_access',
        space: {
          connect: {
            id: space.id
          }
        },
        page: {
          connect: {
            id: page.id
          }
        }
      }
    });

    const inherited = await prisma.pagePermission.create({
      data: {
        permissionLevel: 'full_access',
        space: {
          connect: {
            id: space.id
          }
        },
        page: {
          connect: {
            id: childPage.id
          }
        },
        sourcePermission: {
          connect: {
            id: source.id
          }
        }
      }
    });

    const found = await getPage(childPage.id) as IPageWithPermissions;

    expect(found).toBeDefined();

    expect(found.permissions).toBeInstanceOf(Array);

    expect(found.permissions[0]).toEqual <PagePermission>(
      expect.objectContaining<Partial<IPagePermissionWithSource>>({
        id: expect.stringMatching(inherited.id),
        spaceId: expect.stringMatching(space.id),
        pageId: expect.stringMatching(childPage.id),
        inheritedFromPermission: expect.stringMatching(source.id)
      })
    );

    expect(found.permissions[0].sourcePermission).toEqual <PagePermission>(
      expect.objectContaining<Partial<IPagePermissionWithSource>>({
        id: expect.stringMatching(source.id),
        spaceId: expect.stringMatching(space.id),
        pageId: expect.stringMatching(page.id),
        inheritedFromPermission: null
      })
    );
  });
});
