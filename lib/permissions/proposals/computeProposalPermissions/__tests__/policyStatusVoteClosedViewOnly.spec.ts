import type { ProposalCategory, Space, User } from '@charmverse/core/dist/prisma';

import type { ProposalWithUsers } from 'lib/proposal/interface';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { AvailableProposalPermissions } from '../../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../../interfaces';
import { policyStatusVoteClosedViewOnly } from '../policyStatusVoteClosedViewOnly';

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
    proposalStatus: 'vote_closed',
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

describe('policyStatusVoteClosedViewOnly', () => {
  it('should perform a no-op if the status is not vote_closed', async () => {
    const permissions = await policyStatusVoteClosedViewOnly({
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
      vote: true,
      make_public: true
    });
  });

  it('should allow authors to view and make public', async () => {
    const permissions = await policyStatusVoteClosedViewOnly({
      flags: fullPermissions,
      isAdmin: false,
      resource: proposal,
      userId: proposalAuthor.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      vote: false,
      make_public: true,
      create_vote: false,
      comment: false,
      delete: false,
      edit: false,
      review: false
    });
  });

  it('should allow admins to view, make public and delete', async () => {
    const permissions = await policyStatusVoteClosedViewOnly({
      flags: fullPermissions,
      isAdmin: true,
      resource: proposal,
      userId: adminUser.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      make_public: true,
      delete: true,
      vote: false,
      create_vote: false,
      comment: false,
      edit: false,
      review: false
    });
  });

  it('should only allow users to view', async () => {
    const users = [proposalReviewer, spaceMember];

    for (const user of users) {
      const permissions = await policyStatusVoteClosedViewOnly({
        flags: fullPermissions,
        isAdmin: false,
        resource: proposal,
        userId: user.id
      });

      expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
        view: true,
        vote: false,
        make_public: false,
        create_vote: false,
        comment: false,
        delete: false,
        edit: false,
        review: false
      });
    }
  });
});
