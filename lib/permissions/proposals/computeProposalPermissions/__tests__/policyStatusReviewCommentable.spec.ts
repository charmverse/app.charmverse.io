import type { ProposalCategory, Space, User } from '@charmverse/core/dist/prisma';

import type { ProposalWithUsers } from 'lib/proposal/interface';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { AvailableProposalPermissions } from '../../availableProposalPermissions.class';
import type { AvailableProposalPermissionFlags } from '../../interfaces';
import { policyStatusReviewCommentable } from '../policyStatusReviewCommentable';

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
    proposalStatus: 'review',
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

describe('policyStatusReviewCommentable', () => {
  it('should perform a no-op if the status is not review', async () => {
    const permissions = await policyStatusReviewCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: { ...proposal, status: 'draft' },
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
  it('should allow the author to view, comment, delete and make public', async () => {
    const permissions = await policyStatusReviewCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: proposal,
      userId: proposalAuthor.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      comment: true,
      delete: true,
      make_public: true,
      edit: false,
      create_vote: false,
      review: false,
      vote: false
    });
  });

  it('should allow a user who is author and reviewer to view, comment, delete, review and make public', async () => {
    const proposalWithSameAuthorReviewer = await generateProposal({
      categoryId: proposalCategory.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'review',
      spaceId: space.id,
      userId: proposalAuthor.id,
      reviewers: [
        {
          group: 'user',
          id: proposalAuthor.id
        }
      ]
    });

    const permissions = await policyStatusReviewCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: proposalWithSameAuthorReviewer,
      userId: proposalAuthor.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      delete: true,
      review: true,
      comment: true,
      make_public: true,
      edit: false,
      create_vote: false,
      vote: false
    });
  });

  it('should allow the admin to view, comment, edit, delete, review and make public', async () => {
    const permissions = await policyStatusReviewCommentable({
      flags: fullPermissions,
      isAdmin: true,
      resource: proposal,
      userId: adminUser.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      edit: true,
      delete: true,
      review: true,
      comment: true,
      make_public: true,
      create_vote: false,
      vote: false
    });
  });

  it('should allow reviewer to view, comment and review', async () => {
    const permissions = await policyStatusReviewCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: proposal,
      userId: proposalReviewer.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      comment: true,
      review: true,
      make_public: false,
      edit: false,
      delete: false,
      create_vote: false,
      vote: false
    });
  });

  it('should allow space members to view', async () => {
    const permissions = await policyStatusReviewCommentable({
      flags: fullPermissions,
      isAdmin: false,
      resource: proposal,
      userId: spaceMember.id
    });

    expect(permissions).toMatchObject<AvailableProposalPermissionFlags>({
      view: true,
      make_public: false,
      comment: false,
      edit: false,
      delete: false,
      create_vote: false,
      review: false,
      vote: false
    });
  });
});
