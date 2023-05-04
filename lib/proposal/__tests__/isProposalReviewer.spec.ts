import { prisma } from '@charmverse/core';
import type { ProposalCategory, Role, Space, User } from '@charmverse/core/dist/prisma';

import type { ProposalWithUsers } from 'lib/proposal/interface';
import { generateUserAndSpace, generateSpaceUser, generateRole } from 'testing/setupDatabase';
import { generateProposalCategory, generateProposal } from 'testing/utils/proposals';

import { isProposalReviewer } from '../isProposalReviewer';

let proposal: ProposalWithUsers;
let proposalCategory: ProposalCategory;
let space: Space;
let proposalAuthor: User;
let proposalReviewer: User;
let spaceMember: User;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: true
  });

  space = generated.space;
  proposalAuthor = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  spaceMember = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  proposalReviewer = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });

  role = await generateRole({
    createdBy: generated.user.id,
    spaceId: space.id
  });

  proposal = await generateProposal({
    categoryId: proposalCategory.id,
    authors: [proposalAuthor.id],
    proposalStatus: 'draft',
    spaceId: space.id,
    userId: proposalAuthor.id,
    reviewers: [
      {
        group: 'user',
        id: proposalReviewer.id
      },
      {
        group: 'role',
        id: role.id
      }
    ]
  });
});

describe('isProposalReviewer', () => {
  it('should return true if user is an individual reviewer for the proposal', async () => {
    const isReviewer = await isProposalReviewer({
      proposal,
      userId: proposalReviewer.id
    });
    expect(isReviewer).toBe(true);
  });

  it('should return true if user has a role that is a reviewer for the proposal', async () => {
    const reviewerByRole = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

    const spaceRole = await prisma.spaceRole.findUnique({
      where: {
        spaceUser: {
          spaceId: space.id,
          userId: reviewerByRole.id
        }
      }
    });

    await prisma.spaceRoleToRole.create({
      data: {
        role: { connect: { id: role.id } },
        spaceRole: { connect: { id: spaceRole?.id as string } }
      }
    });

    const isReviewer = await isProposalReviewer({
      proposal,
      userId: reviewerByRole.id
    });
    expect(isReviewer).toBe(true);
  });

  it('should return false if user is not a reviewer for the proposal', async () => {
    const isReviewer = await isProposalReviewer({
      proposal,
      userId: spaceMember.id
    });
    expect(isReviewer).toBe(false);
  });
});
