import { VoteStatus } from '@prisma/client';
import { calculateVoteStatus } from '../calculateVoteStatus';

describe('calculateVoteStatus', () => {
  it('should return cancelled for vote with cancelled status', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'Cancelled',
      type: 'Approval',
      deadline: new Date(),
      userVotes: [{
        choice: '1'
      }, {
        choice: '1'
      }, {
        choice: '2'
      }]
    });
    expect(voteStatus).toBe(VoteStatus.Cancelled);
  });

  it('should return passed for approval type vote with yes crossing threshold', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'InProgress',
      type: 'Approval',
      deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      userVotes: [{
        choice: 'Yes'
      }, {
        choice: 'Yes'
      }, {
        choice: 'No'
      }]
    });
    expect(voteStatus).toBe(VoteStatus.Passed);
  });

  it('should return rejected for approval type vote with yes not crossing threshold', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'InProgress',
      type: 'Approval',
      deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      userVotes: [{
        choice: 'Yes'
      }, {
        choice: 'No'
      }, {
        choice: 'No'
      }]
    });
    expect(voteStatus).toBe(VoteStatus.Rejected);
  });

  it('should return passed for single choice type vote with one option crossing threshold', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 50,
      status: 'InProgress',
      type: 'SingleChoice',
      deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      userVotes: [{
        choice: '1'
      }, {
        choice: '1'
      }, {
        choice: '2'
      }]
    });
    expect(voteStatus).toBe(VoteStatus.Passed);
  });

  it('should return rejected for single choice type vote with no option crossing threshold', async () => {
    const voteStatus = calculateVoteStatus({
      threshold: 75,
      status: 'InProgress',
      type: 'SingleChoice',
      deadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      userVotes: [{
        choice: '1'
      }, {
        choice: '1'
      }, {
        choice: '2'
      }]
    });
    expect(voteStatus).toBe(VoteStatus.Rejected);
  });
});
