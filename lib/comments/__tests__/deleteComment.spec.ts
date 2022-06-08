
import { Space, User } from '@prisma/client';
import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { deleteComment } from '../deleteComment';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4(), true);
  user = generated.user;
  space = generated.space;
});

describe('deleteComment', () => {

  it('should delete a comment and return true', async () => {

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const thread = await prisma.thread.create({
      data: {
        context: 'Random context',
        resolved: false,
        page: {
          connect: {
            id: page.id
          }
        },
        user: {
          connect: {
            id: user.id
          }
        },
        space: {
          connect: {
            id: space.id
          }
        }
      }
    });

    const comment = await prisma.comment.create({
      data: {
        page: {
          connect: {
            id: page.id
          }
        },
        thread: {
          connect: {
            id: thread.id
          }
        },
        user: {
          connect: {
            id: user.id
          }
        },
        space: {
          connect: {
            id: space.id
          }
        }
      }
    });

    const deleteResult = await deleteComment(comment.id);

    expect(deleteResult).toBe(true);
  });

  it('should fail if the comment to delete does not exist', async () => {
    try {
      await deleteComment(v4());
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

});

