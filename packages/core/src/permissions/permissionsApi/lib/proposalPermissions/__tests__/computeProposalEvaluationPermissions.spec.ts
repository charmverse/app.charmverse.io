import type { ProposalOperation, Role, Space, User } from '@charmverse/core/prisma';
import { ProposalEvaluationResult, prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { AvailableProposalPermissions } from '@packages/core/permissions';
import type { ProposalPermissionFlags } from '@packages/core/permissions';
import { v4 as uuid } from 'uuid';

import {
  baseAuthorProposalPermissions,
  baseEvaluatorPermissions,
  computeProposalEvaluationPermissions
} from '../computeProposalEvaluationPermissions';

describe('baseAuthorProposalPermissions', () => {
  it('should contain the correct permissions', () => {
    expect(baseAuthorProposalPermissions).toEqual(['view', 'view_private_fields', 'delete', 'create_vote']);
  });
});

describe('computeProposalEvaluationPermissions - author', () => {
  let space: Space;
  let author: User;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace());
  });
  it('should grant edit, edit_rewards view, view_private_fields, delete, comment, archive, unarchive create_vote, and move permissions to the author of a draft proposal', async () => {
    const draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      evaluationInputs: []
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: draftProposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        'view',
        'view_private_fields',
        'delete',
        'edit',
        'edit_rewards',
        'comment',
        'move',
        'archive',
        'unarchive',
        'create_vote'
      ]).operationFlags
    );
  });

  it('should always allow the author to at least view, view_private_fields, delete, create_vote the proposal whatever its status or permissions', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [] }]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        'view',
        'view_private_fields',
        'delete',
        'create_vote'
      ]).operationFlags
    );
  });

  it('should grant the author reviewer permissions if they are also a reviewer for the current proposal step', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'vote', permissions: [], reviewers: [{ group: 'space_member' }] }]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        ...baseAuthorProposalPermissions,
        ...baseEvaluatorPermissions
      ]).operationFlags
    );
  });

  it('should grant a custom permission (such as comment) if there is a permission for the current step with the system role author', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'author' }, operation: 'comment' }],
          reviewers: []
        }
      ]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        ...baseAuthorProposalPermissions,
        'comment'
      ]).operationFlags
    );
  });

  it('should grant the author edit rewards permission if they have edit permission for a step', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'author' }, operation: 'edit' }],
          reviewers: []
        }
      ]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        ...baseAuthorProposalPermissions,
        'edit',
        'edit_rewards'
      ]).operationFlags
    );
  });

  it('should deny the author edit proposal permission, but still grant edit_rewards if the proposal has passed, and they have edit permission for a step', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'author' }, operation: 'edit' }],
          reviewers: [],
          result: ProposalEvaluationResult.pass
        }
      ]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        ...baseAuthorProposalPermissions,
        'edit_rewards'
      ]).operationFlags
    );
  });
});

describe('computeProposalEvaluationPermissions - admin', () => {
  let space: Space;
  let author: User;
  let admin: User;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace());
    admin = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: true });
  });

  it('should grant full permissions except evaluate for a space admin when proposal is in draft status', async () => {
    const draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      evaluationInputs: []
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: draftProposal.id,
      userId: admin.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).full
    );
  });

  it('should grant full permissions for a space admin when proposal is not in draft status', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [] }]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: admin.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).full
    );
  });
});

describe('computeProposalEvaluationPermissions - reviewer', () => {
  let space: Space;
  let author: User;
  let reviewer: User;
  let reviewerByRole: User;
  let role: Role;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace());
    reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reviewerByRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    role = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: author.id,
      assigneeUserIds: [reviewerByRole.id]
    });
  });
  it('should grant evaluate permission if user is a reviewer for current proposal step', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [
            { group: 'user', id: reviewer.id },
            { group: 'role', id: role.id }
          ]
        }
      ]
    });

    const reviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(expect.objectContaining({ evaluate: true }));

    const reviewerByRolePermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewerByRole.id
    });

    expect(reviewerByRolePermissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ evaluate: true })
    );
  });

  it('should grant view_private_fields permission if user is a reviewer for current proposal step', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [
            { group: 'user', id: reviewer.id },
            { group: 'role', id: role.id }
          ]
        }
      ]
    });

    const reviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ view_private_fields: true })
    );

    const reviewerByRolePermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewerByRole.id
    });

    expect(reviewerByRolePermissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ view_private_fields: true })
    );
  });

  it('should grant a custom permission (such as comment) if user is a reviewer for current proposal step and permission system_role is current_reviewer', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'comment' }],
          reviewers: [
            { group: 'user', id: reviewer.id },
            { group: 'role', id: role.id }
          ]
        }
      ]
    });

    const reviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(expect.objectContaining({ comment: true }));

    const reviewerByRolePermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewerByRole.id
    });

    expect(reviewerByRolePermissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ comment: true })
    );
  });

  it('should grant a custom permission (such as comment) if user is a reviewer for any proposal step, and permission system_role is all_reviewers', async () => {
    const approverUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [
            { group: 'user', id: reviewer.id },
            { group: 'role', id: role.id }
          ],
          approvers: [{ group: 'user', id: approverUser.id }],
          result: 'pass'
        },
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'all_reviewers' }, operation: 'comment' }],
          reviewers: []
        }
      ]
    });

    const expectedOperations: ProposalOperation[] = ['comment', 'view_notes', 'view', 'view_private_fields'];

    const reviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(expectedOperations).operationFlags
    );

    const reviewerByRolePermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewerByRole.id
    });

    expect(reviewerByRolePermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(expectedOperations).operationFlags
    );
  });

  it('should not grant evaluate permission if user is not a reviewer for current proposal step', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [
            { group: 'user', id: reviewer.id },
            { group: 'role', id: role.id }
          ],
          result: 'pass'
        },
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: []
        }
      ]
    });

    const reviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions.evaluate).toBe(false);

    const reviewerByRolePermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewerByRole.id
    });

    expect(reviewerByRolePermissions.evaluate).toBe(false);
  });

  it('should preserve evaluate permission for reviewers of current evaluation if the proposal has been failed or has passed its final evaluation', async () => {
    const failedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [
            { group: 'user', id: reviewer.id },
            { group: 'role', id: role.id }
          ],
          result: 'fail'
        },
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: []
        }
      ]
    });

    const completeProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [
            { group: 'user', id: reviewer.id },
            { group: 'role', id: role.id }
          ],
          result: 'pass'
        }
      ]
    });

    const reviewerFailedProposalPermissions = await computeProposalEvaluationPermissions({
      resourceId: failedProposal.id,
      userId: reviewer.id
    });

    expect(reviewerFailedProposalPermissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ evaluate: true })
    );

    const reviewerByRoleFailedProposalPermissions = await computeProposalEvaluationPermissions({
      resourceId: failedProposal.id,
      userId: reviewerByRole.id
    });

    expect(reviewerByRoleFailedProposalPermissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ evaluate: true })
    );

    const reviewerPassedProposalPermissions = await computeProposalEvaluationPermissions({
      resourceId: completeProposal.id,
      userId: reviewer.id
    });

    expect(reviewerPassedProposalPermissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ evaluate: true })
    );

    const reviewerByRolePassedProposalPermissions = await computeProposalEvaluationPermissions({
      resourceId: completeProposal.id,
      userId: reviewerByRole.id
    });

    expect(reviewerByRolePassedProposalPermissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ evaluate: true })
    );
  });

  it('should not provide view permission if user is not a reviewer for the current evaluation step and there are no permissions for the user', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [{ group: 'user', id: reviewer.id }],
          result: 'pass'
        },
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: []
        }
      ]
    });

    const reviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });
    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([]).operationFlags
    );
  });
});
describe('computeProposalEvaluationPermissions - custom permissions', () => {
  let space: Space;
  let author: User;
  let member: User;
  let reviewerByRole: User;
  let role: Role;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace());
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reviewerByRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    role = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: author.id,
      assigneeUserIds: [reviewerByRole.id]
    });
  });

  it('should grant a custom permission (such as comment) if there is a permission for the current step for that specific user', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'user', id: member.id }, operation: 'comment' }],
          reviewers: []
        }
      ]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: member.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['comment']).operationFlags
    );
  });

  it('should grant a custom permission (such as comment) if there is a permission for the current step for a role that specific user has', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'role', id: role.id }, operation: 'comment' }],
          reviewers: []
        }
      ]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewerByRole.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['comment']).operationFlags
    );
  });

  it('should grant a custom permission (such as comment) if there is a permission for the current step with the system role space_member, and user is a space member', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'space_member' }, operation: 'comment' }],
          reviewers: []
        }
      ]
    });

    const permissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: member.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['comment']).operationFlags
    );
  });

  it('should grant archive and unarchive permissions if the user has a move permission', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'user', id: member.id }, operation: 'move' }],
          reviewers: [{ group: 'role', id: role.id }]
        }
      ]
    });

    const memberPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: member.id
    });

    expect(memberPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['archive', 'unarchive', 'move'])
        .operationFlags
    );
  });

  it('should not grant archive and unarchive permissions if it was archived by an admin', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'user', id: member.id }, operation: 'move' }],
          reviewers: [{ group: 'role', id: role.id }]
        }
      ]
    });

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        archived: true,
        archivedByAdmin: true
      }
    });

    const memberPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: member.id
    });

    expect(memberPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['move']).operationFlags
    );
  });

  it('should grant the complete_evaluation permission to current reviewers if this permission was not provided', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [{ group: 'role', id: role.id }]
        }
      ]
    });

    const reviewerByRolePermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewerByRole.id
    });

    expect(reviewerByRolePermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        'complete_evaluation',
        'evaluate',
        'view',
        'view_notes',
        'view_private_fields'
      ]).operationFlags
    );
  });

  it('should grant the complete_evaluation permission to any user or role', async () => {
    const spaceMemberReviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const memberWithRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const newRole = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: author.id,
      assigneeUserIds: [memberWithRole.id]
    });

    const normalMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [{ group: 'user', id: spaceMemberReviewer.id }],
          approvers: [
            { group: 'user', id: normalMember.id },
            { group: 'role', id: newRole.id }
          ]
        }
      ]
    });

    const normalMemberPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: normalMember.id
    });

    const spaceMemberReviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: spaceMemberReviewer.id
    });

    const memberWithRolePermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: memberWithRole.id
    });

    expect(spaceMemberReviewerPermissions.complete_evaluation).toBe(false);

    expect(normalMemberPermissions.complete_evaluation).toBe(true);

    expect(memberWithRolePermissions.complete_evaluation).toBe(true);
  });
});

describe('computeProposalEvaluationPermissions - external users', () => {
  it('should grant view permission if the proposal has a public workflow permission and it is published', async () => {
    const { space, user: author } = await testUtilsUser.generateUserAndSpace();

    const publicProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          reviewers: [],
          permissions: [{ assignee: { group: 'public' }, operation: 'view' }]
        }
      ]
    });

    await prisma.pagePermission.createMany({
      data: [{ pageId: publicProposal.id, public: true, permissionLevel: 'view' }]
    });

    const externalUserPermissionsWhileDraft = await computeProposalEvaluationPermissions({
      resourceId: publicProposal.id,
      userId: undefined
    });

    expect(externalUserPermissionsWhileDraft).toMatchObject(
      new AvailableProposalPermissions({ isReadonlySpace: false }).empty
    );

    await prisma.proposal.update({
      where: { id: publicProposal.id },
      data: { status: 'published' }
    });

    const externalUserPermissionsWhilePublished = await computeProposalEvaluationPermissions({
      resourceId: publicProposal.id,
      userId: undefined
    });

    expect(externalUserPermissionsWhilePublished).toMatchObject(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['view']).operationFlags
    );
  });

  // We decided to move public proposals from toggle / page permissions to a public workflow permission
  it('should ignore space public proposals toggle, and public page permissions', async () => {
    const { space, user: author } = await testUtilsUser.generateUserAndSpace({
      publicProposals: true
    });

    const publicProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          permissions: [],
          reviewers: []
        }
      ]
    });

    await prisma.pagePermission.create({
      data: {
        page: { connect: { id: publicProposal.page.id } },
        permissionLevel: 'view',
        public: true
      }
    });

    const externalUserPermissions = await computeProposalEvaluationPermissions({
      resourceId: publicProposal.id,
      userId: undefined
    });

    expect(externalUserPermissions).toMatchObject(new AvailableProposalPermissions({ isReadonlySpace: false }).empty);
  });
});
describe('computeProposalEvaluationPermissions - specific evaluation', () => {
  it('should compute user permissions based on a specific evaluation ID if this is provided', async () => {
    const { space, user: author } = await testUtilsUser.generateUserAndSpace();

    const reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const otherUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const stepWhereUserIsReviewer = uuid();
    const stepWhereUserIsNotReviewer = uuid();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          id: stepWhereUserIsReviewer,
          permissions: [],
          evaluationType: 'pass_fail',
          reviewers: [
            {
              group: 'user',
              id: reviewer.id
            }
          ],
          approvers: [{ group: 'user', id: otherUser.id }]
        },
        {
          id: stepWhereUserIsNotReviewer,
          permissions: [],
          evaluationType: 'pass_fail',
          reviewers: []
        }
      ]
    });

    const reviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id,
      evaluationId: stepWhereUserIsReviewer
    });

    expect(reviewerPermissions).toMatchObject(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['evaluate']).operationFlags
    );

    const reviewerPermissionsOtherStep = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id,
      evaluationId: stepWhereUserIsNotReviewer
    });

    expect(reviewerPermissionsOtherStep).toMatchObject(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([]).operationFlags
    );
  });
});

describe('computeProposalEvaluationPermissions - proposal with private workflow evaluations', () => {
  it('should deny move permissions for a user if they are not a reviewer, and the workflow uses private evaluations', async () => {
    const { space, user: admin } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    const reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const workflow = await prisma.proposalWorkflow.create({
      data: {
        index: 0,
        title: 'Workflow',
        createdAt: new Date(),
        // Important part
        privateEvaluations: true,
        evaluations: [],
        space: { connect: { id: space.id } }
      }
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: member.id,
      proposalStatus: 'published',
      workflowId: workflow.id,
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback 1',
          permissions: [
            { assignee: { group: 'author' }, operation: 'move' },
            { assignee: { group: 'current_reviewer' }, operation: 'move' },
            { assignee: { group: 'space_member' }, operation: 'view' }
          ],
          result: 'pass',
          reviewers: [{ group: 'user', id: reviewer.id }]
        },
        {
          evaluationType: 'feedback',
          title: 'Feedback 2',
          permissions: [
            { assignee: { group: 'author' }, operation: 'move' },
            { assignee: { group: 'current_reviewer' }, operation: 'move' },
            { assignee: { group: 'space_member' }, operation: 'view' }
          ],
          reviewers: [{ group: 'user', id: reviewer.id }]
        },
        {
          evaluationType: 'pass_fail',
          permissions: [
            { assignee: { group: 'author' }, operation: 'move' },
            { assignee: { group: 'current_reviewer' }, operation: 'move' },
            { assignee: { group: 'space_member' }, operation: 'view' }
          ],
          reviewers: [{ group: 'user', id: reviewer.id }]
        }
      ]
    });

    const memberPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: member.id
    });
    const reviewerPermissions = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(memberPermissions.move).toBe(true);
    expect(reviewerPermissions.move).toBe(true);

    const feedbackEval = await prisma.proposalEvaluation.findFirstOrThrow({
      where: {
        type: 'feedback',
        proposalId: proposal.id,
        result: null
      }
    });

    await prisma.proposalEvaluation.update({
      where: {
        id: feedbackEval.id
      },
      data: {
        result: 'pass'
      }
    });

    const memberPermissionsInPrivateEvaluation = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: member.id
    });
    const reviewerPermissionsInPrivateEvaluation = await computeProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(memberPermissionsInPrivateEvaluation.move).toBe(false);
    expect(reviewerPermissionsInPrivateEvaluation.move).toBe(true);
  });
});
