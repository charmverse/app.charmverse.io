import { aggregateResults } from 'lib/proposal/rubric/aggregateResults';

describe('aggregateResults', () => {
  it('should aggregate results and return data in proper shape', async () => {
    const result = aggregateResults({
      answers: [
        {
          rubricCriteriaId: '11',
          response: { score: 7 },
          comment: 'my opinion',
          userId: '1',
          proposalId: '111'
        }
      ],
      reviewers: [{ id: '1' }],
      criteria: [
        { id: '11', title: 't1', type: 'range', parameters: { min: 1, max: 10 }, description: 'd1', proposalId: '111' }
      ]
    });

    expect(result.criteriaSummary['11'].average).toEqual(7);
    expect(result.criteriaSummary['11'].sum).toEqual(7);
    expect(result.reviewersResults[0].average).toEqual(7);
    expect(result.reviewersResults[0].id).toEqual('1');
    expect(result.reviewersResults[0].answersMap).toMatchObject({
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
          rubricCriteriaId: '11',
          response: { score: 7 },
          comment: null,
          userId: '1',
          proposalId: '111'
        },
        {
          rubricCriteriaId: '11',
          response: { score: 3 },
          comment: null,
          userId: '2',
          proposalId: '111'
        },
        {
          rubricCriteriaId: '22',
          response: { score: 1 },
          comment: null,
          userId: '1',
          proposalId: '111'
        },
        {
          rubricCriteriaId: '22',
          response: { score: 3 },
          comment: null,
          userId: '2',
          proposalId: '111'
        }
      ],
      reviewers: [{ id: '1' }, { id: '2' }],
      criteria: [
        { id: '11', title: 't1', type: 'range', parameters: { min: 1, max: 10 }, description: 'd1', proposalId: '111' },
        { id: '22', title: 't2', type: 'range', parameters: { min: 1, max: 10 }, description: 'd2', proposalId: '111' }
      ]
    });

    expect(result.criteriaSummary['11'].average).toEqual(5);
    expect(result.criteriaSummary['11'].sum).toEqual(10);
    expect(result.criteriaSummary['22'].average).toEqual(2);
    expect(result.criteriaSummary['22'].sum).toEqual(4);
    expect(result.reviewersResults[0].average).toEqual(4);
    expect(result.reviewersResults[0].id).toEqual('1');
    expect(result.reviewersResults[1].average).toEqual(3);
    expect(result.reviewersResults[1].id).toEqual('2');
    expect(result.reviewersResults[0].answersMap).toMatchObject({
      11: {
        score: 7,
        comment: null
      },
      22: {
        score: 1,
        comment: null
      }
    });

    expect(result.reviewersResults[1].answersMap).toMatchObject({
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
          rubricCriteriaId: '11',
          response: { score: 7 },
          comment: 'my opinion',
          userId: '1',
          proposalId: '111'
        },
        {
          rubricCriteriaId: '11',
          response: { score: null as any },
          comment: null,
          userId: '1',
          proposalId: '111'
        },
        {
          rubricCriteriaId: '11',
          response: { score: '2' as any },
          comment: null,
          userId: '1',
          proposalId: '111'
        },
        {
          rubricCriteriaId: '22',
          response: { score: '3' as any },
          comment: null,
          userId: '1',
          proposalId: '111'
        }
      ],
      reviewers: [{ id: '1' }],
      criteria: [
        { id: '11', title: 't1', type: 'range', parameters: { min: 1, max: 10 }, description: 'd1', proposalId: '111' },
        { id: '22', title: 't2', type: 'range', parameters: { min: 1, max: 10 }, description: 'd2', proposalId: '111' }
      ]
    });

    expect(result.criteriaSummary['11'].average).toEqual(7);
    expect(result.criteriaSummary['11'].sum).toEqual(7);
    expect(result.criteriaSummary['22'].average).toEqual(null);
    expect(result.criteriaSummary['22'].sum).toEqual(null);
    expect(result.reviewersResults[0].average).toEqual(7);
    expect(result.reviewersResults[0].id).toEqual('1');
    expect(result.reviewersResults[0].answersMap).toMatchObject({
      11: {
        score: 7,
        comment: 'my opinion'
      }
    });
  });
});
