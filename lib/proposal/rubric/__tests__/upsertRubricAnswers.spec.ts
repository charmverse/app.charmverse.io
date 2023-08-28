import { InvalidInputError } from '@charmverse/core/errors';
import type { Proposal, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from '../interfaces';
import { upsertRubricAnswers } from '../upsertRubricAnswers';
import { upsertRubricCriteria } from '../upsertRubricCriteria';

describe('upsertRubricAnswers', () => {
  let user: User;
  let space: Space;
  let proposal: Proposal;

  let vibeCriteria: ProposalRubricCriteriaWithTypedParams<'range'>;
  let scoreCriteria: ProposalRubricCriteriaWithTypedParams<'range'>;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({});
    user = generated.user;
    space = generated.space;
    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });
    const criteria = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [
        { title: 'score', type: 'range', parameters: { max: 10, min: 1 } },
        { title: 'vibe', type: 'range', parameters: { max: 10, min: 1 } }
      ]
    });

    vibeCriteria = criteria.find((c) => c.title === 'vibe') as ProposalRubricCriteriaWithTypedParams;
    scoreCriteria = criteria.find((c) => c.title === 'score') as ProposalRubricCriteriaWithTypedParams;
  });

  it('should insert new answers and return them', async () => {
    const evaluator = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const answers = await upsertRubricAnswers({
      answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 7 }, comment: 'my opinion' }],
      userId: evaluator.id,
      proposalId: proposal.id
    });

    expect(answers[0]).toMatchObject<ProposalRubricCriteriaAnswerWithTypedResponse>({
      proposalId: proposal.id,
      rubricCriteriaId: scoreCriteria.id,
      userId: evaluator.id,
      comment: 'my opinion',
      response: {
        score: 7
      }
    });
  });

  it('should update existing answers and return them, leaving non-referenced answers unchanged and returning the modified answers', async () => {
    const evaluator = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const firstSet = await upsertRubricAnswers({
      answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 7 }, comment: 'first' }],
      userId: evaluator.id,
      proposalId: proposal.id
    });

    expect(firstSet).toHaveLength(1);
    expect(firstSet[0].response.score).toEqual(7);
    expect(firstSet[0].rubricCriteriaId).toEqual(scoreCriteria.id);
    expect(firstSet[0].comment).toEqual('first');

    const firstSetUpdated = await upsertRubricAnswers({
      answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 6 }, comment: 'second' }],
      userId: evaluator.id,
      proposalId: proposal.id
    });

    expect(firstSetUpdated).toHaveLength(1);
    expect(firstSetUpdated[0].response.score).toEqual(6);
    expect(firstSetUpdated[0].rubricCriteriaId).toEqual(scoreCriteria.id);
    expect(firstSetUpdated[0].comment).toEqual('second');

    const secondSet = await upsertRubricAnswers({
      answers: [{ rubricCriteriaId: vibeCriteria.id, response: { score: 7 } }],
      userId: evaluator.id,
      proposalId: proposal.id
    });

    expect(secondSet).toHaveLength(1);
    expect(secondSet[0].rubricCriteriaId).toEqual(vibeCriteria.id);

    const updatedAnswers = await prisma.proposalRubricCriteriaAnswer.findMany({
      where: {
        proposalId: proposal.id,
        userId: evaluator.id
      }
    });

    // Make sure we didn't delete any answers
    expect(updatedAnswers).toHaveLength(2);
  });

  it('should throw an error if some answers are for rubric criteria in a different proposal', async () => {
    const otherProposal = await testUtilsProposals.generateProposal({ spaceId: space.id, userId: user.id });

    const evaluator = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await expect(
      upsertRubricAnswers({
        answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: 7 } }],
        userId: evaluator.id,
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
        userId: evaluator.id,
        proposalId: proposal.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    // Below the minimum
    await expect(
      upsertRubricAnswers({
        answers: [{ rubricCriteriaId: scoreCriteria.id, response: { score: -5 } }],
        userId: evaluator.id,
        proposalId: proposal.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if an answer references an inexistent rubric criteria', async () => {
    await expect(
      upsertRubricAnswers({
        answers: [{ rubricCriteriaId: uuid(), response: { score: 3 } }],
        userId: user.id,
        proposalId: proposal.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
