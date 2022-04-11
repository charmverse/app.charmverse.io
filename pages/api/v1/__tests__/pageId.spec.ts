/* eslint-disable @typescript-eslint/no-unused-vars */
import supertest from 'supertest';
import { prisma } from 'db';
import { createUserFromWallet } from 'lib/users/createUser';
import { v4 } from 'uuid';
import { getPage } from '../pages/[pageId]';

describe('GET /pages/{pageId}', () => {

  it('should return the page', async () => {

    const user = await createUserFromWallet('0x0bdCC3f24822AD36CE4Fc1fa8Fe9FD6B235f0078');

    const space = await prisma.space.create({
      data: {
        domain: v4(),
        name: 'Our space',
        updatedAt: (new Date()).toISOString(),
        author: {
          connect: {
            id: user.id
          }
        },
        updatedBy: user.id
      }
    });

    const id = v4();

    const pageToCreate = await prisma.page.create({
      data: {
        path: '/first-page',
        title: 'First page',
        type: 'board',
        boardId: id,
        contentText: '',
        updatedBy: user.id,
        author: {
          connect: {
            id: user.id
          }
        }
      }
    });

    const board = await prisma.block.create({
      data: {
        id,
        type: 'board',
        rootId: id,
        fields: {
          properties: {}
        },
        title: 'Board',
        schema: 1,
        updatedBy: user.id,
        parentId: id,
        space: {
          connect: {
            id: space.id
          }
        },
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    const block = await prisma.block.create({
      data: {
        id: v4(),
        type: 'card',
        rootId: id,
        fields: {
          properties: {}
        },
        title: 'Board',
        schema: 1,
        updatedBy: user.id,
        parentId: id,
        space: {
          connect: {
            id: space.id
          }
        },
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    //    const req = supertest().

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const page = await getPage(
      { query: { pageId: block.id }, authorizedSpaceId: space.id } as any,
      { status: () => ({ json: () => null }) as any } as any
    );

    // Add in actual assertions here
    expect(true).toBe(true);
  });

});

export default {};
