import type { ProposalWorkflow, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { work } from '@root/lib/rewards/work';
import { v4 as uuid } from 'uuid';

import type { MinimalProposal } from '../concealProposalSteps';
import { concealProposalSteps } from '../concealProposalSteps';

describe('concealProposalSteps', () => {
  const proposalId = 'proposal1';

  let space: Space;

  let adminUser: User;
  let reviewerUser: User;
  let appealReviewerUser: User;
  let author: User;

  let privateProposalWorkflow: ProposalWorkflow;

  let proposalWithSteps: MinimalProposal;

  beforeAll(async () => {
    ({ space, user: adminUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    author = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    reviewerUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    appealReviewerUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    privateProposalWorkflow = await prisma.proposalWorkflow.create({
      data: {
        index: 1,
        title: 'Workflow',
        space: { connect: { id: space.id } },
        privateEvaluations: true
      }
    });

    proposalWithSteps = {
      spaceId: space.id,
      workflowId: privateProposalWorkflow.id,
      id: proposalId,
      workflow: { privateEvaluations: true },
      authors: [{ userId: author.id }],
      evaluations: [
        {
          id: uuid(),
          type: 'feedback',
          result: null,
          index: 0,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ]
        },
        {
          id: uuid(),
          type: 'rubric',
          result: null,
          index: 1,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ]
        },
        {
          id: uuid(),
          type: 'pass_fail',
          result: null,
          index: 2,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ],
          appealReviewers: [
            {
              userId: appealReviewerUser.id,
              roleId: null,
              id: '',
              proposalId: '',
              evaluationId: ''
            }
          ]
        }
      ]
    };
  });

  it('should return unchanged proposal if the linked workflow does not use private proposals', async () => {
    const normalProposalWorkflow = await prisma.proposalWorkflow.create({
      data: {
        index: 1,
        title: 'Workflow',
        space: { connect: { id: space.id } }
      }
    });

    const proposalWithNormalFlow = {
      ...proposalWithSteps,
      workflowId: normalProposalWorkflow.id,
      workflow: normalProposalWorkflow
    };

    const result = await concealProposalSteps({
      proposal: { ...proposalWithNormalFlow },
      userId: author.id
    });
    expect(result).toMatchObject(proposalWithNormalFlow);
  });

  it('should return unchanged proposal for admins', async () => {
    const result = await concealProposalSteps({
      proposal: { ...proposalWithSteps },
      userId: adminUser.id
    });
    expect(result).toMatchObject(proposalWithSteps);
  });

  it('should return unchanged proposal for reviewers', async () => {
    const result = await concealProposalSteps({
      proposal: { ...proposalWithSteps },
      userId: reviewerUser.id
    });
    expect(result).toEqual(proposalWithSteps);
  });

  it('should return unchanged proposal for appeal reviewers', async () => {
    const result = await concealProposalSteps({
      proposal: { ...proposalWithSteps },
      userId: appealReviewerUser.id
    });
    expect(result).toEqual(proposalWithSteps);
  });

  it('should return the step where the proposal failed despite being hidden, if the step is configured to show rubric results on fail, and the user is the author', async () => {
    const proposalWithShowUserResultsOnFail: MinimalProposal = {
      ...proposalWithSteps,
      evaluations: [
        {
          id: uuid(),
          type: 'feedback',
          result: null,
          index: 0,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ]
        },
        {
          id: uuid(),
          type: 'rubric',
          result: 'fail',
          index: 1,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ],
          showAuthorResultsOnRubricFail: true
        },
        {
          id: uuid(),
          type: 'pass_fail',
          result: null,
          index: 2,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ],
          appealReviewers: [
            {
              userId: appealReviewerUser.id,
              roleId: null,
              id: '',
              proposalId: '',
              evaluationId: ''
            }
          ]
        }
      ]
    };

    const result = await concealProposalSteps({
      proposal: proposalWithShowUserResultsOnFail,
      userId: author.id
    });
    expect(result.evaluations).toEqual([
      { ...proposalWithShowUserResultsOnFail.evaluations[0] },
      { ...proposalWithShowUserResultsOnFail.evaluations[1] },
      expect.objectContaining({
        ...proposalWithShowUserResultsOnFail.evaluations[2],
        type: 'private_evaluation',
        title: 'Evaluation',
        reviewers: [],
        permissions: []
      })
    ]);
  });

  it('should correctly conceal and collapse evaluations', async () => {
    const result = await concealProposalSteps({
      proposal: { ...proposalWithSteps },
      userId: author.id
    });
    expect(result.evaluations).toEqual([
      { ...proposalWithSteps.evaluations[0] },
      expect.objectContaining({
        ...proposalWithSteps.evaluations[1],
        type: 'private_evaluation',
        title: 'Evaluation',
        reviewers: [],
        permissions: []
      })
    ]);
  });

  it('should use status of the last empty evaluation', async () => {
    const proposalWithCustomSteps: MinimalProposal = {
      spaceId: space.id,
      workflowId: privateProposalWorkflow.id,
      id: proposalId,
      authors: [{ userId: author.id }],
      evaluations: [
        {
          id: uuid(),
          type: 'feedback',
          result: 'pass',
          index: 1,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ]
        },
        {
          id: uuid(),
          type: 'rubric',
          result: 'pass',
          index: 2,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ]
        },
        {
          id: uuid(),
          type: 'pass_fail',
          result: null,
          index: 2,
          reviewers: [
            { evaluationId: '', id: '', proposalId: '', roleId: null, systemRole: null, userId: reviewerUser.id }
          ]
        }
      ]
    };

    const result = await concealProposalSteps({
      proposal: { ...proposalWithCustomSteps },
      userId: author.id
    });
    expect(result.evaluations).toEqual([
      { ...proposalWithCustomSteps.evaluations[0] },
      expect.objectContaining({
        ...proposalWithCustomSteps.evaluations[2],
        type: 'private_evaluation',
        title: 'Evaluation',
        reviewers: []
      })
    ]);
  });

  it('should handle proposals without workflow IDs', async () => {
    const proposalWithoutWorkflow = { ...proposalWithSteps, workflowId: null };
    const result = await concealProposalSteps({
      proposal: proposalWithoutWorkflow,
      userId: author.id
    });
    expect(result).toMatchObject(proposalWithoutWorkflow);
  });

  it('should return empty evaluations when given empty input', async () => {
    const emptyProposal = { ...proposalWithSteps, evaluations: [] };
    const result = await concealProposalSteps({
      proposal: emptyProposal,
      userId: author.id
    });
    expect(result.evaluations).toEqual([]);
  });
});
