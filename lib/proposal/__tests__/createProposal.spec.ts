import { Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { prisma } from 'db';
import { createProposal } from '../createProposal';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;

  // External space the user didn't create but is a contributor of
  const { space: generatedSpace } = await generateUserAndSpaceWithApiToken();
  // Inaccessible space by the user
  await generateUserAndSpaceWithApiToken();
  space = generatedSpace;

  await prisma.spaceRole.create({
    data: {
      userId: user.id,
      spaceId: space.id
    }
  });
});

describe('Creates a page and proposal with relevant configuration', () => {
  it('Create a page and returns it with the attached proposal', async () => {
    const pageWithProposal = await createProposal({
      pageCreateInput: {
        author: {
          connect: {
            id: user.id
          }
        },
        contentText: '',
        path: 'path',
        space: {
          connect: {
            id: space.id
          }
        },
        title: 'page-title',
        type: 'proposal',
        updatedBy: user.id
      },
      spaceId: space.id,
      userId: user.id
    });

    expect(pageWithProposal).toMatchObject(expect.objectContaining({
      title: 'page-title',
      type: 'proposal',
      proposal: expect.objectContaining({
        authors: [{
          proposalId: pageWithProposal.id,
          userId: user.id
        }],
        reviewers: []
      })
    }));
  });
});
