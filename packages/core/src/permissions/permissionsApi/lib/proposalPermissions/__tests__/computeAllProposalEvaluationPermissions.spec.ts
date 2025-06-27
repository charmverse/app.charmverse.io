import type { Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { AvailableProposalPermissions } from '@packages/core/permissions';
import { v4 as uuid } from 'uuid';

import { computeAllProposalEvaluationPermissions } from '../computeAllProposalEvaluationPermissions';

describe('computeAllProposalEvaluationPermissions', () => {
  let space: Space;
  let admin: User;

  beforeAll(async () => {
    ({ space, user: admin } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
  });
  it('should return all permissions a user will have for each evaluation of the draft proposal', async () => {
    const reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const stepWhereUserIsReviewer = uuid();
    const stepWhereUserIsNotReviewer = uuid();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: admin.id,
      authors: [],
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

    const allStepPermissions = await computeAllProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(allStepPermissions).toMatchObject({
      [stepWhereUserIsReviewer]: new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        'evaluate',
        'complete_evaluation'
      ]).operationFlags,
      [stepWhereUserIsNotReviewer]: new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([])
        .operationFlags
    });
  });

  it('should return all permissions a user will have for each evaluation of the published proposal', async () => {
    const reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const stepWhereUserIsReviewer = uuid();
    const stepWhereUserIsNotReviewer = uuid();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: admin.id,
      authors: [],
      proposalStatus: 'published',
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

    const allStepPermissions = await computeAllProposalEvaluationPermissions({
      resourceId: proposal.id,
      userId: reviewer.id
    });

    expect(allStepPermissions).toMatchObject({
      [stepWhereUserIsReviewer]: new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        'evaluate',
        'view',
        'view_notes',
        'view_private_fields',
        'complete_evaluation'
      ]).operationFlags,
      [stepWhereUserIsNotReviewer]: new AvailableProposalPermissions({ isReadonlySpace: false }).addPermissions([
        'view',
        'view_notes',
        'view_private_fields'
      ]).operationFlags
    });
  });
});
