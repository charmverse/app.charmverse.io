import { VoteStatus } from '@charmverse/core/prisma';

import { calculateVoteStatus } from '../calculateVoteStatus';

// 30 days ago
const expiredDeadline = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// 30 days left
const nonExpiredDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

describe('calculateVoteStatus', () => {
  it('should return cancelled for vote with cancelled status', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'Cancelled',
      type: 'Approval',
      deadline: new Date(),
      userVotes: [
        {
          choices: ['1']
        },
        {
          choices: ['1']
        },
        {
          choices: ['2']
        }
      ]
    });
    expect(voteStatus).toBe(VoteStatus.Cancelled);
  });

  it("should return the same status for vote that hasn't passed the deadline", async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'InProgress',
      type: 'Approval',
      deadline: nonExpiredDeadline,
      userVotes: [
        {
          choices: ['1']
        },
        {
          choices: ['1']
        },
        {
          choices: ['2']
        }
      ]
    });
    expect(voteStatus).toBe(VoteStatus.InProgress);
  });

  it('should return rejected for approval type vote when percentage of yes votes crosses threshold', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'InProgress',
      type: 'Approval',
      deadline: expiredDeadline,
      userVotes: [
        {
          choices: ['Yes']
        },
        {
          choices: ['Yes']
        },
        {
          choices: ['No']
        }
      ]
    });
    expect(voteStatus).toBe(VoteStatus.Passed);
  });

  it("should return rejected for approval type vote when percentage of yes votes doesn't cross threshold", async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'InProgress',
      type: 'Approval',
      deadline: expiredDeadline,
      userVotes: [
        {
          choices: ['Yes']
        },
        {
          choices: ['No']
        },
        {
          choices: ['No']
        }
      ]
    });
    expect(voteStatus).toBe(VoteStatus.Rejected);
  });

  it('should return passed for single choice type vote with any one of the options crossing threshold', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'InProgress',
      type: 'SingleChoice',
      deadline: expiredDeadline,
      userVotes: [
        {
          choices: ['1']
        },
        {
          choices: ['1']
        },
        {
          choices: ['2']
        }
      ]
    });
    expect(voteStatus).toBe(VoteStatus.Passed);
  });

  it('should return rejected for single choice type vote with none of the options crossing threshold', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 75,
      status: 'InProgress',
      type: 'SingleChoice',
      deadline: expiredDeadline,
      userVotes: [
        {
          choices: ['1']
        },
        {
          choices: ['1']
        },
        {
          choices: ['2']
        }
      ]
    });
    expect(voteStatus).toBe(VoteStatus.Rejected);
  });
});
