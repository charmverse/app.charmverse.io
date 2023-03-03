import type { ProposalCategory, Space, User } from '@prisma/client';

import type { ProposalWithUsers } from 'lib/proposal/interface';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { AvailableProposalPermissions } from '../../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../../interfaces';
import { policyStatusVoteActiveOnlyVotable } from '../policyStatusVoteActiveOnlyVotable';

let proposal: ProposalWithUsers;
let proposalCategory: ProposalCategory;
let space: Space;
let adminUser: User;
let proposalAuthor: User;
let proposalReviewer: User;
let spaceMember: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: true
  });

  adminUser = generated.user;
  space = generated.space;
  proposalAuthor = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  spaceMember = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  proposalReviewer = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });

  proposal = await generateProposal({
    categoryId: proposalCategory.id,
    authors: [proposalAuthor.id],
    proposalStatus: 'vote_active',
    spaceId: space.id,
    userId: proposalAuthor.id,
    reviewers: [
      {
        group: 'user',
        id: proposalReviewer.id
      }
    ]
  });
});

const fullPermissions = new AvailableProposalPermissions().full;

describe('policyStatusVoteActiveOnlyVotable', () => {
  it('should perform a no-op if the status is not vote_active', async () => {
    const permissions = await policyStatusVoteActiveOnlyVotable({
      flags: fullPermissions,
      isAdmin: false,
      resource: { ...proposal, status: 'discussion' },
      userId: proposalAuthor.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      edit: true,
      delete: true,
      comment: true,
      create_vote: true,
      review: true,
      vote: true
    });
  });
  it('should only allow users to view and vote', async () => {
    const users = [proposalAuthor, adminUser, proposalReviewer, spaceMember];

    for (const user of users) {
      const permissions = await policyStatusVoteActiveOnlyVotable({
        flags: fullPermissions,
        isAdmin: false,
        resource: proposal,
        userId: user.id
      });

      expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
        view: true,
        vote: true,
        create_vote: false,
        comment: false,
        delete: false,
        edit: false,
        review: false
      });
    }
  });
});
