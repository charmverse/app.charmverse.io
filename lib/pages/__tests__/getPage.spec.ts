import { Page, PagePermission, Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken, createPage } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { getPage } from '../server/getPage';

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

    const foundPage = await getPage(page.id);

    expect(foundPage).toEqual <Page>(
      expect.objectContaining<Partial<Page>>({
        id: expect.any(String),
        title: expect.any(String),
        path: expect.any(String),
        content: expect.any(Object)
      })
    );
  });

  it('should return null if the page does not exist', async () => {
    const foundPage = await getPage(v4());
    expect(foundPage).toBe(null);
  });

  it('should return a page\'s permissions, and which permissions they inherit from', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: page.id
    });

    await prisma.pagePermission.create({
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
          create: {
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
        }
      }
    });

    const found = await getPage(childPage.id);

    expect(found?.permissions).toBeInstanceOf(Array);

    expect(found?.permissions[0].sourcePermission).toEqual <PagePermission>(
      expect.objectContaining<Partial<PagePermission>>({
        id: expect.any(String),
        spaceId: expect.stringContaining(space.id),
        pageId: expect.stringContaining(page.id)
      })
    );

  });
});
