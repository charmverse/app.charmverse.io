import type { Space, User } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import { getAnswersTable } from '@packages/lib/proposals/rubric/getAnswersTable';
import { v4 as uuid } from 'uuid';

import type { ProposalRubricCriteriaAnswerWithTypedResponse, RubricCriteriaTyped } from '../interfaces';
import { upsertRubricAnswers } from '../upsertRubricAnswers';
import { upsertRubricCriteria } from '../upsertRubricCriteria';

describe('upsertRubricAnswers', () => {
  let user: User;
  let space: Space;
  let proposal: Awaited<ReturnType<typeof testUtilsProposals.generateProposal>>;

  let vibeCriteria: RubricCriteriaTyped<'range'>;
  let scoreCriteria: RubricCriteriaTyped<'range'>;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({});
    user = generated.user;
    space = generated.space;
    proposal = await rubricProposal({
      spaceId: space.id,
      userId: user.id
    });
    const criteria = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [
        { title: 'score', type: 'range', parameters: { max: 10, min: 1 } },
        { title: 'vibe', type: 'range', parameters: { max: 10, min: 1 } }
      ],
      actorId: user.id
    });

    vibeCriteria = criteria.find((c) => c.title === 'vibe') as RubricCriteriaTyped;
    scoreCriteria = criteria.find((c) => c.title === 'score') as RubricCriteriaTyped;
  });

  it('should update existing answers and return them, removing non-referenced answers', async () => {
    const evaluator = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await upsertRubricAnswers({
      answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 7 }, comment: 'first' }],
      evaluationId: proposal.evaluations[0].id,
      userId: evaluator.id,
      proposalId: proposal.id
    });

    const firstSet = await getResponses({
      proposalId: proposal.id,
      userId: evaluator.id
    });

    expect(firstSet).toHaveLength(1);
    expect(firstSet[0].response.score).toEqual(7);
    expect(firstSet[0].rubricCriteriaId).toEqual(scoreCriteria.id);
    expect(firstSet[0].comment).toEqual('first');

    await upsertRubricAnswers({
      answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 6 }, comment: 'second' }],
      evaluationId: proposal.evaluations[0].id,
      userId: evaluator.id,
      proposalId: proposal.id
    });

    const firstSetUpdated = await getResponses({
      proposalId: proposal.id,
      userId: evaluator.id
    });

    expect(firstSetUpdated).toHaveLength(1);
    expect(firstSetUpdated[0].response.score).toEqual(6);
    expect(firstSetUpdated[0].rubricCriteriaId).toEqual(scoreCriteria.id);
    expect(firstSetUpdated[0].comment).toEqual('second');

    await upsertRubricAnswers({
      answers: [{ rubricCriteriaId: vibeCriteria.id, response: { score: 7 } }],
      userId: evaluator.id,
      evaluationId: proposal.evaluations[0].id,
      proposalId: proposal.id
    });

    const secondSet = await getResponses({
      proposalId: proposal.id,
      userId: evaluator.id
    });

    expect(secondSet).toHaveLength(1);
    expect(secondSet[0].rubricCriteriaId).toEqual(vibeCriteria.id);
  });

  it('should throw an error if some answers are for rubric criteria in a different proposal', async () => {
    const otherProposal = await rubricProposal({ spaceId: space.id, userId: user.id });

    const evaluator = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await expect(
      upsertRubricAnswers({
        answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 7 } }],
        userId: evaluator.id,
        evaluationId: otherProposal.evaluations[0].id,
        proposalId: otherProposal.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if an answer is invalid based on its matching criteria', async () => {
    const evaluator = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    // Above the maximum
    await expect(
      upsertRubricAnswers({
        answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 100000 } }],
        evaluationId: proposal.evaluations[0].id,
        userId: evaluator.id,
        proposalId: proposal.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    // Below the minimum
    await expect(
      upsertRubricAnswers({
        answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: -5 } }],
        evaluationId: proposal.evaluations[0].id,
        userId: evaluator.id,
        proposalId: proposal.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if an answer references an inexistent rubric criteria', async () => {
    await expect(
      upsertRubricAnswers({
        answers: [{ rubricCriteriaId: uuid(), response: { score: 3 } }],
        evaluationId: proposal.evaluations[0].id,
        userId: user.id,
        proposalId: proposal.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should save draft rubric criteria', async () => {
    const evaluator = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await upsertRubricAnswers({
      answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 7 }, comment: 'first' }],
      evaluationId: proposal.evaluations[0].id,
      userId: evaluator.id,
      proposalId: proposal.id,
      isDraft: true
    });

    const firstSet = await getResponses({
      proposalId: proposal.id,
      userId: evaluator.id
    });

    expect(firstSet).toHaveLength(0);

    const draftAnswers = await getResponses({
      proposalId: proposal.id,
      userId: evaluator.id,
      isDraft: true
    });

    expect(draftAnswers).toHaveLength(1);
  });
});

async function getResponses({
  proposalId,
  userId,
  isDraft
}: {
  proposalId: string;
  userId: string;
  isDraft?: boolean;
}): Promise<ProposalRubricCriteriaAnswerWithTypedResponse[]> {
  const answers = await getAnswersTable({ isDraft }).findMany({
    where: {
      proposalId,
      userId
    }
  });
  return answers as ProposalRubricCriteriaAnswerWithTypedResponse[];
}

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
