import type { Proposal, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { stringUtils } from '@packages/core/utilities';

import { getAccessibleProposalIdsUsingEvaluation } from '../getAccessibleProposalIdsUsingEvaluation';

describe('getAccessibleProposalIdsUsingEvaluation - admin', () => {
  let space: Space;
  let admin: User;
  let member: User;
  let role: Role;
  let adminProposal: Proposal;
  let memberProposal: Proposal;
  let memberProposalWhereAdminIsReviewer: Proposal;
  let memberProposalWhereAdminIsReviewerByRole: Proposal;
  let memberProposalWhereAdminIsReviewerForPreviousStep: Proposal;
  let draftMemberProposal: Proposal;

  beforeAll(async () => {
    ({ space, user: admin } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    role = await testUtilsMembers.generateRole({ spaceId: space.id, assigneeUserIds: [admin.id], createdBy: admin.id });
    adminProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: admin.id,
      title: 'admin proposal',
      proposalStatus: 'published'
    });
    memberProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      title: 'member proposal',
      proposalStatus: 'published'
    });
    memberProposalWhereAdminIsReviewer = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      title: 'member proposal where admin is reviewer',
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'vote', reviewers: [{ group: 'user', id: admin.id }], permissions: [] }]
    });
    memberProposalWhereAdminIsReviewerByRole = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      title: 'member proposal where admin is reviewer by role',
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'vote', reviewers: [{ group: 'role', id: role.id }], permissions: [] }]
    });
    memberProposalWhereAdminIsReviewerForPreviousStep = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      title: 'member proposal where admin is reviewer for previous step',
      proposalStatus: 'published',
      evaluationInputs: [
        { evaluationType: 'vote', reviewers: [{ group: 'user', id: admin.id }], result: 'pass', permissions: [] },
        // Current relevant step
        { evaluationType: 'vote', reviewers: [], permissions: [] }
      ]
    });
    draftMemberProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      title: 'draft member proposal',
      proposalStatus: 'draft'
    });
  });
  it('should return all proposals to admins, even drafts', async () => {
    const accessibleIds = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: admin.id
    });

    expect(stringUtils.sortUuids(accessibleIds)).toEqual(
      stringUtils.sortUuids([
        adminProposal.id,
        memberProposal.id,
        memberProposalWhereAdminIsReviewer.id,
        memberProposalWhereAdminIsReviewerByRole.id,
        memberProposalWhereAdminIsReviewerForPreviousStep.id,
        draftMemberProposal.id
      ])
    );
  });

  it('should return only proposals where admin is an author or reviewer for the current evaluation if onlyAssigned is true', async () => {
    const accessibleIds = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: admin.id,
      onlyAssigned: true
    });

    expect(stringUtils.sortUuids(accessibleIds)).toEqual(
      stringUtils.sortUuids([
        adminProposal.id,
        memberProposalWhereAdminIsReviewer.id,
        memberProposalWhereAdminIsReviewerByRole.id
      ])
    );
  });
});
describe('getAccessibleProposalIdsUsingEvaluation - author', () => {
  let space: Space;
  let author: User;
  let member: User;
  let draftProposal: Proposal;
  let publishedProposal: Proposal;
  let memberProposal: Proposal;
  let memberProposalWhereAuthorUserIsReviewer: Proposal;
  let publicMemberProposal: Proposal;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ isAdmin: false }));
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft'
    });
    publishedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published'
    });
    memberProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      proposalStatus: 'published',
      evaluationInputs: []
    });
    memberProposalWhereAuthorUserIsReviewer = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'vote', reviewers: [{ group: 'user', id: author.id }], permissions: [] }]
    });
    publicMemberProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      proposalStatus: 'published'
    });
    await prisma.pagePermission.createMany({
      data: [{ pageId: publicMemberProposal.id, public: true, permissionLevel: 'view' }]
    });
  });
  it('should always return proposals where the user is an author', async () => {
    const accessibleIds = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: author.id
    });

    expect(stringUtils.sortUuids(accessibleIds)).toEqual(
      stringUtils.sortUuids([draftProposal.id, publishedProposal.id, memberProposalWhereAuthorUserIsReviewer.id])
    );
  });

  it('should only return proposals where the user is an author or reviewer if onlyAssigned is true', async () => {
    const accessibleIds = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: author.id,
      onlyAssigned: true
    });

    expect(stringUtils.sortUuids(accessibleIds)).toEqual(
      stringUtils.sortUuids([draftProposal.id, publishedProposal.id, memberProposalWhereAuthorUserIsReviewer.id])
    );
  });
});

describe('getAccessibleProposalIdsUsingEvaluation - reviewer', () => {
  let space: Space;
  let author: User;
  let member: User;
  let reviewerById: User;
  let reviewerByRole: User;
  let role: Role;
  let draftProposal: Proposal;
  let publishedProposal: Proposal;
  let proposalWithPublicPermission: Proposal;
  let proposalReviewedByUserId: Proposal;
  let proposalReviewedByRoleId: Proposal;
  let proposalReviewedByAllMembers: Proposal;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ isAdmin: false }));
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reviewerById = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reviewerByRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    role = await testUtilsMembers.generateRole({
      spaceId: space.id,
      assigneeUserIds: [reviewerByRole.id],
      createdBy: member.id
    });
    draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      title: 'draft',
      reviewers: [
        { group: 'user', id: reviewerById.id },
        { group: 'role', id: role.id }
      ]
    });
    publishedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'published',
      proposalStatus: 'published'
    });
    proposalWithPublicPermission = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'public',
      proposalStatus: 'published'
    });
    proposalReviewedByUserId = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'reviewed by user',
      proposalStatus: 'published',
      evaluationInputs: [
        { evaluationType: 'vote', result: 'pass', reviewers: [{ group: 'role', id: role.id }], permissions: [] },
        { evaluationType: 'vote', reviewers: [{ group: 'user', id: reviewerById.id }], permissions: [] }
      ]
    });
    proposalReviewedByRoleId = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'reviewed by role',
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [{ group: 'user', id: reviewerById.id }],
          permissions: [],
          result: 'pass'
        },
        { evaluationType: 'vote', reviewers: [{ group: 'role', id: role.id }], permissions: [] }
      ]
    });
    proposalReviewedByAllMembers = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'reviewed by all members',
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'vote', reviewers: [{ group: 'space_member' }], permissions: [] }]
    });
    await prisma.pagePermission.createMany({
      data: [{ pageId: proposalWithPublicPermission.id, public: true, permissionLevel: 'view' }]
    });
  });
  it('should return all proposals where the user is an individual reviewer for the current evaluation', async () => {
    const accessibleToReviewerByUserId = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: reviewerById.id
    });
    expect(stringUtils.sortUuids(accessibleToReviewerByUserId)).toEqual(
      stringUtils.sortUuids([proposalReviewedByUserId.id, proposalReviewedByAllMembers.id])
    );
  });

  it('should return all proposals where the user is a reviewer by role for the current evaluation', async () => {
    const accessibleToReviewerByUserId = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: reviewerByRole.id
    });

    expect(stringUtils.sortUuids(accessibleToReviewerByUserId)).toEqual(
      stringUtils.sortUuids([proposalReviewedByRoleId.id, proposalReviewedByAllMembers.id])
    );
  });

  it('should return all proposals where the user is a space member and the reviewer is all_members', async () => {
    const accessibleToReviewerByUserId = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: member.id
    });

    expect(stringUtils.sortUuids(accessibleToReviewerByUserId)).toEqual(
      stringUtils.sortUuids([proposalReviewedByAllMembers.id])
    );
  });

  it('should return only proposals where user is an author or reviewer for current evaluation if onlyAssigned is true', async () => {
    const accessibleIds = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: reviewerById.id,
      onlyAssigned: true
    });

    expect(stringUtils.sortUuids(accessibleIds)).toEqual(
      stringUtils.sortUuids([proposalReviewedByUserId.id, proposalReviewedByAllMembers.id])
    );
  });
});

describe('getAccessibleProposalIdsUsingEvaluation - custom permissions', () => {
  let space: Space;
  let author: User;
  let member: User;
  let userWithIndividualPermission: User;
  let userWithRolePermission: User;
  let userTargetedByAllReviewersPermission: User;
  let role: Role;
  let draftProposal: Proposal;
  let proposalWithPublicPermission: Proposal;
  let proposalWithCustomPermissionByUserId: Proposal;
  let proposalWithCustomPermissionByRoleId: Proposal;
  let proposalWithCustomPermissionByAllMembers: Proposal;
  let proposalWithCustomPermissionByAllReviewersAndNoCurrentReviewer: Proposal;
  let proposalWithNoViewPermission: Proposal;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ isAdmin: false }));
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userTargetedByAllReviewersPermission = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userWithIndividualPermission = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userWithRolePermission = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    role = await testUtilsMembers.generateRole({
      spaceId: space.id,
      assigneeUserIds: [userWithRolePermission.id],
      createdBy: member.id
    });
    draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'draft',
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [{ assignee: { group: 'user', id: userWithIndividualPermission.id }, operation: 'view' }]
        }
      ]
    });
    proposalWithPublicPermission = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'public',
      proposalStatus: 'published'
    });
    proposalWithCustomPermissionByUserId = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'custom permission by user id',
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [{ assignee: { group: 'user', id: userWithIndividualPermission.id }, operation: 'view' }]
        }
      ]
    });
    proposalWithCustomPermissionByRoleId = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'custom permission by role id',
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [{ assignee: { group: 'role', id: role.id }, operation: 'view' }]
        }
      ]
    });
    proposalWithCustomPermissionByAllMembers = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'custom permission by all members',
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [{ assignee: { group: 'space_member' }, operation: 'view' }]
        }
      ]
    });
    // create a proposal that should not appear because it does not have "view" permission
    proposalWithNoViewPermission = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'custom permission by all members',
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [{ assignee: { group: 'space_member' }, operation: 'comment' }]
        }
      ]
    });
    proposalWithCustomPermissionByAllReviewersAndNoCurrentReviewer = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'custom permission by all reviewers and no current reviewer',
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [
            { group: 'user', id: userTargetedByAllReviewersPermission.id },
            { group: 'role', id: role.id },
            { group: 'user', id: userWithIndividualPermission.id }
          ],
          permissions: [],
          result: 'pass'
        },
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [{ assignee: { group: 'all_reviewers' }, operation: 'view' }]
        }
      ]
    });

    await prisma.pagePermission.createMany({
      data: [{ pageId: proposalWithPublicPermission.id, public: true, permissionLevel: 'view' }]
    });
  });
  it('should return all proposals where the user has an individual permission for the current evaluation', async () => {
    const accessibleToUserWithIndividualPermission = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: userWithIndividualPermission.id
    });

    expect(stringUtils.sortUuids(accessibleToUserWithIndividualPermission)).toEqual(
      stringUtils.sortUuids([
        proposalWithCustomPermissionByUserId.id,
        proposalWithCustomPermissionByAllMembers.id,
        proposalWithCustomPermissionByAllReviewersAndNoCurrentReviewer.id
      ])
    );
  });

  it('should return all proposals where the user has a role-based permission for the current evaluation', async () => {
    const accessibleToUserWithRolePermission = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: userWithRolePermission.id
    });

    expect(stringUtils.sortUuids(accessibleToUserWithRolePermission)).toEqual(
      stringUtils.sortUuids([
        proposalWithCustomPermissionByRoleId.id,
        proposalWithCustomPermissionByAllMembers.id,
        proposalWithCustomPermissionByAllReviewersAndNoCurrentReviewer.id
      ])
    );
  });

  it('should return all proposals where the user is a space member and there is a space_member permission for the current evaluation', async () => {
    const accessibleToMemberUser = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: member.id
    });

    expect(stringUtils.sortUuids(accessibleToMemberUser)).toEqual(
      stringUtils.sortUuids([proposalWithCustomPermissionByAllMembers.id])
    );
  });

  it('should not return a proposal that does not have view permission (copied from previous test)', async () => {
    const accessibleToMemberUser = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: member.id
    });

    expect(accessibleToMemberUser).not.toContain(proposalWithNoViewPermission);
  });

  it('should return all proposals where the user is a reviewer for any evaluation and there is an all_reviewers permission for the current evaluation', async () => {
    const accessibleToAllReviewers = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: userTargetedByAllReviewersPermission.id
    });
    expect(stringUtils.sortUuids(accessibleToAllReviewers)).toEqual(
      stringUtils.sortUuids([
        proposalWithCustomPermissionByAllMembers.id,
        proposalWithCustomPermissionByAllReviewersAndNoCurrentReviewer.id
      ])
    );
  });

  it('should return an empty array if a user is not an author or reviewer for the current proposal step and the onlyAssigned flag is true', async () => {
    const accessibleToUserWithIndividualPermission = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: userWithIndividualPermission.id,
      onlyAssigned: true
    });

    const accessibleToUserWithRolePermission = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: userWithRolePermission.id,
      onlyAssigned: true
    });

    const accessibleToUserWithMemberPermission = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: member.id,
      onlyAssigned: true
    });

    const accessibleToUserWithAllReviewersPermission = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: userTargetedByAllReviewersPermission.id,
      onlyAssigned: true
    });

    const compared = [
      accessibleToUserWithIndividualPermission,
      accessibleToUserWithRolePermission,
      accessibleToUserWithMemberPermission,
      accessibleToUserWithAllReviewersPermission
    ];

    for (let i = 0; i < compared.length; i++) {
      expect(compared[i]).toEqual([]);
    }
  });
});
describe('getAccessibleProposalIdsUsingEvaluation - external users', () => {
  let space: Space;
  let author: User;
  let reviewer: User;
  let member: User;
  let draftProposalWithPublicPermission: Proposal;
  let proposal: Proposal;
  let publishedProposalWithPublicPermission: Proposal;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ isAdmin: false, publicProposals: true }));
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    draftProposalWithPublicPermission = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'draft',
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [{ assignee: { group: 'public' }, operation: 'view' }]
        }
      ]
    });
    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'Pulished',
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          reviewers: [],
          permissions: []
        }
      ]
    });
    publishedProposalWithPublicPermission = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      title: 'Published',
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [{ group: 'user', id: reviewer.id }],
          permissions: [{ assignee: { group: 'public' }, operation: 'view' }]
        }
      ]
    });

    await prisma.pagePermission.createMany({
      data: [{ pageId: proposal.id, public: true, permissionLevel: 'view' }]
    });
  });
  it('should return all published proposals for a none-space member when a public workflow permission exists in current step, ignoring space toggle and public page permissions', async () => {
    const proposalsVisibleToPublic = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: undefined
    });

    expect(stringUtils.sortUuids(proposalsVisibleToPublic)).toEqual(
      stringUtils.sortUuids([publishedProposalWithPublicPermission.id])
    );
  });

  it('should apply public view permissions to members too', async () => {
    const proposalsVisibleToMember = await getAccessibleProposalIdsUsingEvaluation({
      spaceId: space.id,
      userId: member.id
    });

    expect(stringUtils.sortUuids(proposalsVisibleToMember)).toEqual(
      stringUtils.sortUuids([publishedProposalWithPublicPermission.id])
    );
  });
});
