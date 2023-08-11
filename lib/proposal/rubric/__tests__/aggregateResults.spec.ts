import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';

const firstUserId = '1';

const secondUserId = '2';

const firstRubricId = '11';

const secondRubricId = '22';

describe('aggregateResults', () => {
  it('should aggregate results and return data in proper shape', async () => {
    const result = aggregateResults({
      answers: [
        {
          rubricCriteriaId: firstRubricId,
          response: { score: 7 },
          comment: 'my opinion',
          userId: firstUserId,
          proposalId: '111'
        }
      ],
      criteria: [
        {
          id: firstRubricId,
          title: 't1',
          type: 'range',
          parameters: { min: 1, max: 10 },
          description: 'd1',
          proposalId: '111'
        }
      ]
    });

    expect(result.criteriaSummary[firstRubricId].average).toEqual(7);
    expect(result.criteriaSummary[firstRubricId].sum).toEqual(7);
    expect(result.reviewersResults[firstUserId].average).toEqual(7);
    expect(result.reviewersResults[firstUserId].id).toEqual(firstUserId);
    expect(result.reviewersResults[firstUserId].answersMap).toMatchObject({
      11: {
        score: 7,
        comment: 'my opinion'
      }
    });
  });

  it('should aggregate results, calculate averages for users and criteria', async () => {
    const result = aggregateResults({
      answers: [
        {
          rubricCriteriaId: firstRubricId,
          response: { score: 7 },
          comment: null,
          userId: firstUserId,
          proposalId: '111'
        },
        {
          rubricCriteriaId: firstRubricId,
          response: { score: 3 },
          comment: null,
          userId: '2',
          proposalId: '111'
        },
        {
          rubricCriteriaId: secondRubricId,
          response: { score: 1 },
          comment: null,
          userId: firstUserId,
          proposalId: '111'
        },
        {
          rubricCriteriaId: secondRubricId,
          response: { score: 3 },
          comment: null,
          userId: secondUserId,
          proposalId: '111'
        }
      ],
      criteria: [
        {
          id: firstRubricId,
          title: 't1',
          type: 'range',
          parameters: { min: 1, max: 10 },
          description: 'd1',
          proposalId: '111'
        },
        {
          id: secondRubricId,
          title: 't2',
          type: 'range',
          parameters: { min: 1, max: 10 },
          description: 'd2',
          proposalId: '111'
        }
      ]
    });

    expect(result.criteriaSummary[firstRubricId].average).toEqual(5);
    expect(result.criteriaSummary[firstRubricId].sum).toEqual(10);
    expect(result.criteriaSummary[secondRubricId].average).toEqual(2);
    expect(result.criteriaSummary[secondRubricId].sum).toEqual(4);
    expect(result.reviewersResults[firstUserId].average).toEqual(4);
    expect(result.reviewersResults[firstUserId].id).toEqual(firstUserId);
    expect(result.reviewersResults[secondUserId].average).toEqual(3);
    expect(result.reviewersResults[secondUserId].id).toEqual(secondUserId);
    expect(result.reviewersResults[firstUserId].answersMap).toMatchObject({
      11: {
        score: 7,
        comment: null
      },
      22: {
        score: 1,
        comment: null
      }
    });

    expect(result.reviewersResults[secondUserId].answersMap).toMatchObject({
      11: {
        score: 3,
        comment: null
      },
      22: {
        score: 3,
        comment: null
      }
    });
  });

  it('should omit data with incorrect scores', async () => {
    const result = aggregateResults({
      answers: [
        {
          rubricCriteriaId: firstRubricId,
          response: { score: 7 },
          comment: 'my opinion',
          userId: firstUserId,
          proposalId: '111'
        },
        {
          rubricCriteriaId: firstRubricId,
          response: { score: null as any },
          comment: null,
          userId: firstUserId,
          proposalId: '111'
        },
        {
          rubricCriteriaId: firstRubricId,
          response: { score: '2' as any },
          comment: null,
          userId: firstUserId,
          proposalId: '111'
        },
        {
          rubricCriteriaId: secondRubricId,
          response: { score: '3' as any },
          comment: null,
          userId: firstUserId,
          proposalId: '111'
        }
      ],
      criteria: [
        {
          id: firstRubricId,
          title: 't1',
          type: 'range',
          parameters: { min: 1, max: 10 },
          description: 'd1',
          proposalId: '111'
        },
        {
          id: secondRubricId,
          title: 't2',
          type: 'range',
          parameters: { min: 1, max: 10 },
          description: 'd2',
          proposalId: '111'
        }
      ]
    });

    expect(result.criteriaSummary[firstRubricId].average).toEqual(7);
    expect(result.criteriaSummary[firstRubricId].sum).toEqual(7);
    expect(result.criteriaSummary[secondRubricId].average).toEqual(null);
    expect(result.criteriaSummary[secondRubricId].sum).toEqual(null);
    expect(result.reviewersResults[firstUserId].average).toEqual(7);
    expect(result.reviewersResults[firstUserId].id).toEqual(firstUserId);
    expect(result.reviewersResults[firstUserId].answersMap).toMatchObject({
      11: {
        score: 7,
        comment: 'my opinion'
      }
    });
  });
});
