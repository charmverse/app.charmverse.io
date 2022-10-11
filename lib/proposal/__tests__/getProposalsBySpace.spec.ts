import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createUserFromWallet } from 'lib/users/createUser';
import { createProposalWithUsers, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createProposalTemplate } from '../../templates/proposals/createProposalTemplate';
import { createProposal } from '../createProposal';
import { getProposalsBySpace } from '../getProposalsBySpace';
import { syncProposalPermissions } from '../syncProposalPermissions';

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

    expect(adminAccessibleProposals.length).toBe(2);

    expect(adminAccessibleProposals.some(p => p.id === accessibleSpacePageProposal1.id)).toBe(true);
    expect(adminAccessibleProposals.some(p => p.id === accessibleSpacePageProposal2.id)).toBe(true);

  });

  it('should not return proposal templates', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const { page: proposalPage } = await createProposal({
      spaceId: space.id,
      createdBy: user.id,
      contentText: '',
      content: {},
      title: 'Example proposal'
    });

    await syncProposalPermissions({
      proposalId: proposalPage.id
    });

    await createProposalTemplate({
      spaceId: space.id,
      userId: user.id
    });

    const proposals = await getProposalsBySpace({
      userId: user.id,
      spaceId: space.id
    });

    expect(proposals.length).toBe(1);
    expect(proposals[0].id).toBe(proposalPage.id);

  });
});
