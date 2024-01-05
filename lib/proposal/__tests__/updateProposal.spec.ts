import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError } from 'lib/middleware';
import { createProposalWithUsers, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

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
    const result = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer2.id]
    });

    await expect(
      updateProposal({
        proposalId: result.id,
        authors: []
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
});
