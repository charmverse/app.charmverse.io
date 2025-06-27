import type { ProposalOperation, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import type { ProposalPermissionFlags } from '@packages/core/permissions';
import { AvailableProposalPermissions } from '@packages/core/permissions';
import { v4 as uuid } from 'uuid';

import { computeProposalEvaluationPermissionsForFreeSpace } from '../computeProposalEvaluationPermissionsForFreeSpace';

describe('computeProposalEvaluationPermissionsForFreeSpace - author', () => {
  let space: Space;
  let author: User;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ spacePaidTier: 'free' }));
  });
  it('should grant edit, view, view_private_fields, delete, comment, make_public, archive, unarchive and move permissions to the author of a draft proposal', async () => {
    const draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      evaluationInputs: []
    });

    const permissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: draftProposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        'view',
        'delete',
        'make_public',
        'view_private_fields',
        'edit',
        'comment',
        'move',
        'archive',
        'unarchive',
        'create_vote'
      ]).operationFlags
    );
  });

  it('should always allow the author to at least view, view_private_fields, delete, create_vote, and make_public the proposal whatever its status or permissions', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [] }]
    });

    const permissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({
        view: true,
        view_private_fields: true,
        delete: true,
        make_public: true,
        create_vote: true
      })
    );
  });

  it('should grant the author any reviewer permissions if they are also a reviewer for the current proposal step', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [{ group: 'user', id: author.id }] }]
    });

    const permissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      expect.objectContaining({ evaluate: true, view: true, view_private_fields: true })
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
          permissions: [{ assignee: { group: 'user', id: author.id }, operation: 'comment' }],
          reviewers: []
        }
      ]
    });

    const permissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(expect.objectContaining({ comment: true }));
  });
});

describe('computeProposalEvaluationPermissionsForFreeSpace - admin', () => {
  let space: Space;
  let author: User;
  let admin: User;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ spacePaidTier: 'free' }));
    admin = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: true });
  });

  it('should grant full permissions except evaluate for a space admin when proposal is in draft status', async () => {
    const draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      evaluationInputs: []
    });

    const permissions = await computeProposalEvaluationPermissionsForFreeSpace({
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

    const permissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: admin.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).full
    );
  });
});

describe('computeProposalEvaluationPermissionsForFreeSpace - reviewer', () => {
  let space: Space;
  let author: User;
  let reviewer: User;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ spacePaidTier: 'free' }));
    reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
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
          reviewers: [{ group: 'user', id: reviewer.id }]
        }
      ]
    });

    const reviewerPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(expect.objectContaining({ evaluate: true }));
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
          reviewers: [{ group: 'user', id: reviewer.id }]
        }
      ]
    });

    const expectedOperations: ProposalOperation[] = ['view', 'evaluate', 'comment'];

    const reviewerPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(expect.objectContaining({ comment: true }));
  });

  it('should grant a custom permission (such as comment) if user is a reviewer for any proposal step, and permission system_role is all_reviewers', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          permissions: [],
          reviewers: [{ group: 'user', id: reviewer.id }],
          result: 'pass'
        },
        {
          evaluationType: 'rubric',
          permissions: [{ assignee: { group: 'all_reviewers' }, operation: 'comment' }],
          reviewers: []
        }
      ]
    });

    const expectedOperations: ProposalOperation[] = ['view', 'comment'];

    const reviewerPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(
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

    const reviewerPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(reviewerPermissions.evaluate).toBe(false);
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
          reviewers: [{ group: 'user', id: reviewer.id }],
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
          reviewers: [{ group: 'user', id: reviewer.id }],
          result: 'pass'
        }
      ]
    });

    const expectedOperations: ProposalOperation[] = ['view', 'complete_evaluation', 'view_private_fields', 'evaluate'];

    const reviewerFailedProposalPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: failedProposal.id,
      userId: reviewer.id
    });

    expect(reviewerFailedProposalPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(expectedOperations).operationFlags
    );

    const reviewerPassedProposalPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: completeProposal.id,
      userId: reviewer.id
    });

    expect(reviewerPassedProposalPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(expectedOperations).operationFlags
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

    const reviewerPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: reviewer.id
    });
    expect(reviewerPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).empty
    );
  });
});
describe('computeProposalEvaluationPermissionsForFreeSpace - custom permissions', () => {
  let space: Space;
  let author: User;
  let member: User;

  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ spacePaidTier: 'free' }));
    member = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
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

    const permissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: member.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['view', 'comment']).operationFlags
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

    const permissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: member.id
    });

    expect(permissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['view', 'comment']).operationFlags
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
          reviewers: []
        }
      ]
    });

    const memberPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: member.id
    });

    expect(memberPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        'view',
        'archive',
        'unarchive',
        'move'
      ]).operationFlags
    );
  });
});

describe('computeProposalEvaluationPermissionsForFreeSpace - external users', () => {
  let space: Space;
  let author: User;
  beforeAll(async () => {
    ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ spacePaidTier: 'free' }));
  });
  it('should grant view permission to external users if the proposal is not a draft', async () => {
    const publicProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'published',
      evaluationInputs: []
    });
    const externalUserPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: publicProposal.id,
      userId: undefined
    });

    expect(externalUserPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['view']).operationFlags
    );
  });

  it('should not grant view permission to external users if proposal is a draft status', async () => {
    const publicProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      evaluationInputs: []
    });
    const externalUserPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: publicProposal.id,
      userId: undefined
    });

    expect(externalUserPermissions).toMatchObject<ProposalPermissionFlags>(
      new AvailableProposalPermissions({ isReadonlySpace: false }).empty
    );
  });
});
describe('computeProposalEvaluationPermissionsForFreeSpace - specific evaluation', () => {
  it('should compute user permissions based on a specific evaluation ID if this is provided', async () => {
    const { space, user: author } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free'
    });

    const reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

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
          ]
        },
        {
          id: stepWhereUserIsNotReviewer,
          permissions: [],
          evaluationType: 'pass_fail',
          reviewers: []
        }
      ]
    });

    const reviewerPermissions = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: reviewer.id,
      evaluationId: stepWhereUserIsReviewer
    });

    expect(reviewerPermissions).toMatchObject(
      new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions(['evaluate', 'complete_evaluation'])
        .operationFlags
    );

    const reviewerPermissionsOtherStep = await computeProposalEvaluationPermissionsForFreeSpace({
      resourceId: proposal.id,
      userId: reviewer.id,
      evaluationId: stepWhereUserIsNotReviewer
    });

    expect(reviewerPermissionsOtherStep).toMatchObject(
      new AvailableProposalPermissions({ isReadonlySpace: false }).empty
    );
  });
});
