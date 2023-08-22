import { v4 } from 'uuid';

import { aggregateVoteResult } from '../aggregateVoteResult';

describe('aggregateVoteResult', () => {
  it("should count the number of times each option was voted and what the user's choice was", async () => {
    const userId = v4();
    const aggregatedVoteResult = aggregateVoteResult({
      userId,
      userVotes: [
        {
          // old way choice string
          choice: '1',
          choices: [],
          userId
        },
        {
          // new way choices string[]
          choice: '',
          choices: ['1'],
          userId: v4()
        },
        {
          choice: '',
          choices: ['2'],
          userId: v4()
        }
      ],
      voteOptions: [
        {
          name: '1'
        },
        {
          name: '2'
        }
      ]
    });
    expect(aggregatedVoteResult).toStrictEqual({
      userChoice: '1',
      aggregatedResult: {
        1: 2,
        2: 1
      }
    });
  });
});
