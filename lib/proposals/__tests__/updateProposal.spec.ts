import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { InvalidStateError } from '@packages/nextjs/errors';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';

import { updateProposal } from '../updateProposal';

let author1: User;
let author2: User;
let reviewer1: User;
let reviewer2: User;
let space: Space;
beforeAll(async () => {
  const { user: user1, space: generatedSpace } = await generateUserAndSpaceWithApiToken();
  const { user: user2 } = await generateUserAndSpaceWithApiToken();
  const { user: user3 } = await generateUserAndSpaceWithApiToken();
  const { user: user4 } = await generateUserAndSpaceWithApiToken();

  author1 = user1;
  author2 = user2;
  reviewer1 = user3;
  reviewer2 = user4;
  space = generatedSpace;
});

describe('Update proposal specific data', () => {
  it('Should throw error if at least one author is not selected for a proposal', async () => {
    // Create a test proposal first
    const result = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author1.id
    });

    await expect(
      updateProposal({
        proposalId: result.id,
        authors: [],
        actorId: author1.id
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('Should not throw error if at least one author is not selected for a proposal template', async () => {
    // Create a test proposal first
    const result = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author1.id
    });
    // TODO: allow setting page type in mock util
    await prisma.page.update({
      where: {
        id: result.page.id
      },
      data: {
        type: 'proposal_template'
      }
    });

    await updateProposal({
      proposalId: result.id,
      authors: [],
      actorId: author1.id
    });
  });
});
