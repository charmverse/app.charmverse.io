import { InvalidInputError } from '@charmverse/core/errors';
import type { Space, User } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import type { RubricCriteriaTyped } from '../interfaces';
import { upsertRubricCriteria } from '../upsertRubricCriteria';

describe('upsertRubricCriteria', () => {
  let user: User;
  let space: Space;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    space = generated.space;
  });

  it('should upsert new rubric criteria', async () => {
    const proposal = await rubricProposal({
      spaceId: space.id,
      userId: user.id
    });

    const rubrics = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 5, min: 1 } }],
      actorId: user.id
    });

    expect(rubrics).toEqual<RubricCriteriaTyped<'range'>[]>([
      expect.objectContaining({
        id: expect.any(String),
        index: 0,
        description: null,
        parameters: {
          max: 5,
          min: 1
        },
        proposalId: proposal.id,
        title: 'Score',
        type: 'range'
      })
    ]);

    const newRubrics = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [...rubrics, { type: 'range', index: 4, title: 'Second score', parameters: { max: 7, min: 1 } }],
      actorId: user.id
    });

    expect(newRubrics).toEqual<RubricCriteriaTyped<'range'>[]>([
      rubrics[0],
      expect.objectContaining({
        id: expect.any(String),
        index: 4,
        description: null,
        parameters: {
          max: 7,
          min: 1
        },
        proposalId: proposal.id,
        title: 'Second score',
        type: 'range'
      })
    ]);
  });
  it('should update existing criteria', async () => {
    const proposal = await rubricProposal({
      spaceId: space.id,
      userId: user.id
    });

    const rubrics = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 5, min: 1 } }],
      actorId: user.id
    });

    const rubricsAfterUpdate = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ ...rubrics[0], parameters: { max: 10, min: 1 } }],
      actorId: user.id
    });

    expect(rubricsAfterUpdate.length).toBe(1);
    expect(rubricsAfterUpdate[0]).toMatchObject({
      ...rubrics[0],
      parameters: {
        max: 10,
        min: 1
      }
    });
  });

  it('should delete criteria which were not provided', async () => {
    const proposal = await rubricProposal({
      spaceId: space.id,
      userId: user.id
    });

    const rubrics = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 5, min: 1 } }],
      actorId: user.id
    });

    const rubricsAfterUpdate = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ type: 'range', title: 'Other Score', parameters: { max: 10, min: 1 } }],
      actorId: user.id
    });

    expect(rubricsAfterUpdate.length).toBe(1);
    expect(rubricsAfterUpdate[0].id).not.toEqual(rubrics[0].id);
  });

  it('should throw an error if no proposalId is provided', async () => {
    await expect(
      upsertRubricCriteria({
        proposalId: undefined as any,
        evaluationId: undefined as any,
        rubricCriteria: [],
        actorId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if min and max parameters are invalid', async () => {
    const proposal = await rubricProposal({
      spaceId: space.id,
      userId: user.id
    });

    // Missing property
    await expect(
      upsertRubricCriteria({
        proposalId: proposal.id,
        evaluationId: proposal.evaluations[0].id,
        rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 5, min: null as any } }],
        actorId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    // Equal values
    await expect(
      upsertRubricCriteria({
        proposalId: proposal.id,
        evaluationId: proposal.evaluations[0].id,
        rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 5, min: 5 } }],
        actorId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    // Min higher than max
    await expect(
      upsertRubricCriteria({
        proposalId: proposal.id,
        evaluationId: proposal.evaluations[0].id,
        rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 1, min: 5 } }],
        actorId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should create a new rubric property if the ID of the rubric corresponds to a rubric on a different proposal', async () => {
    const proposal = await rubricProposal({
      spaceId: space.id,
      userId: user.id
    });

    const proposalRubric = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 10, min: 1 } }],
      actorId: user.id
    });

    const secondProposal = await rubricProposal({
      spaceId: space.id,
      userId: user.id
    });

    const secondProposalRubric = await upsertRubricCriteria({
      proposalId: secondProposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 10, min: 1 } }],
      actorId: user.id
    });

    const secondProposalRubricAfterUpsert = await upsertRubricCriteria({
      proposalId: secondProposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [proposalRubric[0], secondProposalRubric[0]],
      actorId: user.id
    });

    expect(secondProposalRubricAfterUpsert).toHaveLength(2);
    expect(secondProposalRubricAfterUpsert.some((criteria) => criteria.id === secondProposalRubric[0].id)).toBe(true);
    expect(secondProposalRubricAfterUpsert.every((criteria) => criteria.id !== proposalRubric[0].id)).toBe(true);
  });
});

function rubricProposal({ userId, spaceId }: { userId: string; spaceId: string }) {
  return testUtilsProposals.generateProposal({
    spaceId,
    userId,
    proposalStatus: 'draft',
    evaluationInputs: [
      {
        evaluationType: 'rubric',
        title: 'Rubric',
        reviewers: [],
        permissions: [],
        rubricCriteria: [
          {
            title: 'demo',
            parameters: {
              max: 4,
              min: 1
            }
          }
        ]
      }
    ]
  });
}
