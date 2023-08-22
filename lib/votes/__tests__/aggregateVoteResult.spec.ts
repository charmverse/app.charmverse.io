import { v4 } from 'uuid';

import { aggregateVoteResult } from '../aggregateVoteResult';

describe('aggregateVoteResult', () => {
  it("should count the number of times each option was voted and what the user's choice was", async () => {
    const userId = v4();
    const aggregatedVoteResult = aggregateVoteResult({
      userId,
      userVotes: [
        {
          choice: null,
          choices: ['1', '2'],
          userId
        },
        {
          choice: '1',
          choices: [],
          userId: v4()
        },
        {
          choice: '',
          choices: ['2', '1'],
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
      userChoice: ['1', '2'],
      aggregatedResult: {
        1: 3,
        2: 2
      }
    });
  });
});
