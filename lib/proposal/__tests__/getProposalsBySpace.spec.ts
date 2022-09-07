import { User, Space } from '@prisma/client';
import { createUserFromWallet } from 'lib/users/createUser';
import { createProposalWithUsers, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';
import isEqual from 'lodash/isEqual';
import { getProposalsBySpace } from '../getProposalsBySpace';

let accessibleSpaceUser1: User;
let accessibleSpaceAdminUser: User;
let accessibleSpaceUser2: User;
let accessibleSpace: Space;
let inaccessibleSpace: Space;
let inaccessibleSpaceUser: User;

beforeAll(async () => {
  // Not a space admin
  const generated1 = await generateUserAndSpaceWithApiToken(v4(), false);
  accessibleSpaceUser1 = generated1.user;
  accessibleSpace = generated1.space;
  accessibleSpaceUser2 = await createUserFromWallet(v4());
  accessibleSpaceAdminUser = await createUserFromWallet(v4());

  const generated2 = await generateUserAndSpaceWithApiToken();
  inaccessibleSpace = generated2.space;
  inaccessibleSpaceUser = generated2.user;

  await prisma.spaceRole.create({
    data: {
      userId: accessibleSpaceUser2.id,
      spaceId: accessibleSpace.id
    }
  });

  await prisma.spaceRole.create({
    data: {
      userId: accessibleSpaceAdminUser.id,
      spaceId: accessibleSpace.id,
      isAdmin: true
    }
  });
});

describe('Get all proposals of a space', () => {
  it('Get proposals of a space that the user has either created or has the permission to view', async () => {
    const accessibleSpacePageProposal1 = await createProposalWithUsers({
      spaceId: accessibleSpace.id,
      userId: accessibleSpaceUser1.id,
      authors: [],
      reviewers: []
    });

    await createProposalWithUsers({
      spaceId: inaccessibleSpace.id,
      userId: inaccessibleSpaceUser.id,
      authors: [],
      reviewers: []
    });

    // Only user 2 should have access to view the proposal
    const accessibleSpacePageProposal2 = await createProposalWithUsers({
      spaceId: accessibleSpace.id,
      userId: accessibleSpaceUser2.id,
      authors: [],
      reviewers: []
    });

    const userAccessibleProposals = await getProposalsBySpace({
      userId: accessibleSpaceUser1.id,
      spaceId: accessibleSpace.id
    });

    expect(userAccessibleProposals).toMatchObject([
      expect.objectContaining({
        id: accessibleSpacePageProposal1.id
      })
    ]);

    // Checking if the admin has access to view all the proposals
    const adminAccessibleProposals = await getProposalsBySpace({
      userId: accessibleSpaceAdminUser.id,
      spaceId: accessibleSpace.id
    });

    expect(isEqual(adminAccessibleProposals.map(adminAccessibleProposal => adminAccessibleProposal.id), [
      accessibleSpacePageProposal1.id,
      accessibleSpacePageProposal2.id
    ])).toBe(true);
  });
});
