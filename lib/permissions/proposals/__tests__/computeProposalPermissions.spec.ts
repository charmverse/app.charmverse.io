import type { ProposalPermissionFlags } from '@charmverse/core';
import { prisma, testUtilsProposals, testUtilsUser } from '@charmverse/core';
import type { ProposalCategory, ProposalStatus, Space, User } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { ProposalNotFoundError } from 'lib/proposal/errors';
import { InvalidInputError } from 'lib/utilities/errors';

import { computeProposalPermissions } from '../computeProposalPermissions';

let adminUser: User;
let spaceMemberUser: User;
let proposalAuthor: User;
let proposalReviewer: User;
let space: Space;

let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalAuthor = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalReviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalCategory = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
});
describe('computeProposalPermissions', () => {
  it('should allow the author to view, comment, delete, when the proposal is in review stage', async () => {
    const testedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'review',
      reviewers: [
        {
          id: proposalReviewer.id,
          group: 'user'
        }
      ]
    });

    const permissions = await computeProposalPermissions({
      resourceId: testedProposal.id,
      userId: proposalAuthor.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      view: true,
      comment: true,
      delete: true,
      create_vote: false,
      edit: false,
      review: false,
      vote: false,
      make_public: false
    });
  });

  it('should allow the reviewer to view, comment, review the proposal when it is in review stage', async () => {
    const testedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'review',
      reviewers: [
        {
          id: proposalReviewer.id,
          group: 'user'
        }
      ]
    });

    const permissions = await computeProposalPermissions({
      resourceId: testedProposal.id,
      userId: proposalReviewer.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      view: true,
      comment: true,
      review: true,
      delete: false,
      create_vote: false,
      edit: false,
      vote: false,
      make_public: false
    });
  });

  it('should allow the admin to always see proposals, but only edit the proposal during the discussion, review and reviewed stages', async () => {
    const testedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'draft',
      reviewers: []
    });

    const permissions = await computeProposalPermissions({
      resourceId: testedProposal.id,
      userId: adminUser.id
    });

    expect(permissions.edit).toBe(false);

    const editableStatuses: ProposalStatus[] = ['discussion', 'review', 'reviewed'];

    for (const status of editableStatuses) {
      await prisma.proposal.update({ where: { id: testedProposal.id }, data: { status } });
      const permissionsAtStage = await computeProposalPermissions({
        resourceId: testedProposal.id,
        userId: adminUser.id
      });

      expect(permissionsAtStage.edit).toBe(true);
      expect(permissionsAtStage.view).toBe(true);
    }

    const readonlyStatuses: ProposalStatus[] = ['vote_active', 'vote_closed'];

    for (const status of readonlyStatuses) {
      await prisma.proposal.update({ where: { id: testedProposal.id }, data: { status } });
      const permissionsAtStage = await computeProposalPermissions({
        resourceId: testedProposal.id,
        userId: adminUser.id
      });

      expect(permissionsAtStage.edit).toBe(false);
      expect(permissionsAtStage.view).toBe(true);
    }
  });

  it('should always provide the view permission to the public, expect at draft stage', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: proposalAuthor.id,
      authors: [proposalAuthor.id],
      proposalStatus: 'draft',
      reviewers: []
    });

    const permissions = await computeProposalPermissions({
      resourceId: proposal.id,
      userId: undefined
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>({
      view: false,
      comment: false,
      review: false,
      delete: false,
      create_vote: false,
      edit: false,
      vote: false,
      make_public: false
    });

    const nonDraftStatuses: ProposalStatus[] = ['discussion', 'review', 'reviewed', 'vote_active', 'vote_closed'];

    for (const status of nonDraftStatuses) {
      await prisma.proposal.update({ where: { id: proposal.id }, data: { status } });
      const permissionsAtStage = await computeProposalPermissions({
        resourceId: proposal.id,
        userId: undefined
      });

      expect(permissionsAtStage).toMatchObject<ProposalPermissionFlags>({
        view: true,
        comment: false,
        review: false,
        delete: false,
        create_vote: false,
        edit: false,
        vote: false,
        make_public: false
      });
    }
  });

  it('should throw an error if the proposal does not exist or proposalId is invalid', async () => {
    await expect(
      computeProposalPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(ProposalNotFoundError);

    await expect(
      computeProposalPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      computeProposalPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
