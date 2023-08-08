import { InvalidInputError } from '@charmverse/core/errors';
import type { ProposalCategory, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import type { ProposalRubricCriteriaWithTypedParams } from '../interfaces';
import { upsertRubricCriteria } from '../upsertRubricCriteria';

describe('upsertRubricCriteria', () => {
  let user: User;
  let space: Space;
  let proposalCategory: ProposalCategory;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    user = generated.user;
    space = generated.space;
    proposalCategory = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
  });

  it('should upsert new rubric criteria', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory.id
    });

    const rubrics = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 5, min: 1 } }]
    });

    expect(rubrics).toEqual<ProposalRubricCriteriaWithTypedParams<'range'>[]>([
      {
        id: expect.any(String),
        description: null,
        parameters: {
          max: 5,
          min: 1
        },
        proposalId: proposal.id,
        title: 'Score',
        type: 'range'
      }
    ]);

    const newRubrics = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [...rubrics, { type: 'range', title: 'Second score', parameters: { max: 7, min: 1 } }]
    });

    expect(newRubrics).toEqual<ProposalRubricCriteriaWithTypedParams<'range'>[]>([
      rubrics[0],
      {
        id: expect.any(String),
        description: null,
        parameters: {
          max: 7,
          min: 1
        },
        proposalId: proposal.id,
        title: 'Second score',
        type: 'range'
      }
    ]);
  });
  it('should update existing criteria', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory.id
    });

    const rubrics = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 5, min: 1 } }]
    });

    const rubricsAfterUpdate = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [{ ...rubrics[0], parameters: { max: 10, min: 1 } }]
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
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory.id
    });

    const rubrics = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [{ type: 'range', title: 'Score', parameters: { max: 5, min: 1 } }]
    });

    const rubricsAfterUpdate = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [{ type: 'range', title: 'Other Score', parameters: { max: 10, min: 1 } }]
    });

    expect(rubricsAfterUpdate.length).toBe(1);
    expect(rubricsAfterUpdate[0].id).not.toEqual(rubrics[0].id);
  });
  it('should throw an error if no proposalId is provided', async () => {
    await expect(
      upsertRubricCriteria({
        proposalId: undefined as any,
        rubricCriteria: []
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if some rubrics belong to a different proposal', () => {});
});
