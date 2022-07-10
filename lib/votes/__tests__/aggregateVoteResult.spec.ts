import { v4 } from 'uuid';
import { aggregateVoteResult } from '../aggregateVoteResult';

describe('aggregateVoteResult', () => {
  it('should aggregate vote result and user choice', async () => {
    const userId = v4();
    const aggregatedVoteResult = aggregateVoteResult({
      userId,
      userVotes: [{
        choice: '1',
        userId
      }, {
        choice: '1',
        userId: v4()
      }, {
        choice: '2',
        userId: v4()
      }],
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
