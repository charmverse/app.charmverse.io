import type { AggregateResults } from '@packages/lib/proposals/rubric/aggregateResults';
import { aggregateResults } from '@packages/lib/proposals/rubric/aggregateResults';

const firstUserId = '1';

const secondUserId = '2';

const firstRubricId = '11';
const firstUserComment = 'This looks good!';

const secondRubricId = '22';
const secondUserComment = 'Not bad, could be improved';

describe('aggregateResults', () => {
  it('should aggregate results and return data in proper shape', async () => {
    const result = aggregateResults({
      answers: [
        {
          rubricCriteriaId: firstRubricId,
          response: { score: 8 },
          comment: firstUserComment,
          userId: firstUserId
        },
        {
          rubricCriteriaId: secondRubricId,
          response: { score: 12 },
          comment: firstUserComment,
          userId: firstUserId
        },
        {
          rubricCriteriaId: firstRubricId,
          response: { score: 4 },
          comment: secondUserComment,
          userId: secondUserId
        }
      ],
      criteria: [
        {
          id: firstRubricId
        },
        {
          id: secondRubricId
        }
      ]
    });

    expect(result).toMatchObject<AggregateResults>({
      allScores: {
        // Average of all individual scores (not average of averages)
        average: 8,
        sum: 24
      },
      reviewersResults: {
        [firstUserId]: {
          answersMap: {
            [firstRubricId]: {
              comment: firstUserComment,
              score: 8
            },
            [secondRubricId]: {
              comment: firstUserComment,
              score: 12
            }
          },
          average: 10,
          id: firstUserId,
          sum: 20
        },
        [secondUserId]: {
          answersMap: {
            [firstRubricId]: {
              comment: secondUserComment,
              score: 4
            }
          },
          average: 4,
          id: secondUserId,
          sum: 4
        }
      },
      criteriaSummary: {
        [firstRubricId]: {
          average: 6,
          comments: [firstUserComment, secondUserComment],
          sum: 12
        },
        [secondRubricId]: {
          average: 12,
          comments: [firstUserComment],
          sum: 12
        }
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
          userId: firstUserId
        },
        {
          rubricCriteriaId: firstRubricId,
          response: { score: 3 },
          comment: null,
          userId: '2'
        },
        {
          rubricCriteriaId: secondRubricId,
          response: { score: 1 },
          comment: null,
          userId: firstUserId
        },
        {
          rubricCriteriaId: secondRubricId,
          response: { score: 3 },
          comment: null,
          userId: secondUserId
        }
      ],
      criteria: [
        {
          id: firstRubricId
        },
        {
          id: secondRubricId
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
          userId: firstUserId
        },
        {
          rubricCriteriaId: firstRubricId,
          response: { score: null as any },
          comment: null,
          userId: firstUserId
        },
        {
          rubricCriteriaId: firstRubricId,
          response: { score: '2' as any },
          comment: null,
          userId: firstUserId
        },
        {
          rubricCriteriaId: secondRubricId,
          response: { score: '3' as any },
          comment: null,
          userId: firstUserId
        }
      ],
      criteria: [
        {
          id: firstRubricId
        },
        {
          id: secondRubricId
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

  it('should return nulls if no answers available', async () => {
    expect(
      aggregateResults({
        answers: [],
        criteria: []
      })
    ).toMatchObject<AggregateResults>({
      allScores: { average: null, sum: null },
      criteriaSummary: {},
      reviewersResults: {}
    });

    expect(
      aggregateResults({
        answers: [],
        criteria: [
          {
            id: '1'
          }
        ]
      })
    ).toMatchObject<AggregateResults>({
      allScores: { average: null, sum: null },
      criteriaSummary: {
        '1': { average: null, sum: null, comments: [] }
      },
      reviewersResults: {}
    });
  });
});
