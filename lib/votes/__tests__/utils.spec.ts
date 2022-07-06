import { Vote } from '@prisma/client';
import { VOTE_STATUS } from '../interfaces';
import { isVotingClosed } from '../utils';

const vote: Vote = {
  id: '516f10e5-0218-436d-abb0-17eda9d7e2cd',
  pageId: '9d9c4435-dd36-4a46-883e-f164821db41a',
  title: 'Vote',
  createdBy: 'a25f79d1-87fc-480b-b8fa-4ea664ea10a2',
  threshold: 50,
  deadline: new Date(),
  status: VOTE_STATUS[0],
  createdAt: new Date(),
  spaceId: '4a581759-a677-4613-a088-e7712b7615a9',
  description: ''
};

describe('voting status', () => {

  it('should be closed', () => {
    expect(isVotingClosed({
      ...vote,
      status: VOTE_STATUS[1] // Passed
    })).toBeTrue();
    expect(isVotingClosed({
      ...vote,
      status: VOTE_STATUS[2] // Rejected
    })).toBeTrue();
    expect(isVotingClosed({
      ...vote,
      status: VOTE_STATUS[3] // Cancelled
    })).toBeTrue();
    expect(isVotingClosed({
      ...vote,
      deadline: new Date('2021-07-07') // passed deadline
    })).toBeTrue();
  });

  it('should not be closed', () => {
    expect(isVotingClosed({
      ...vote,
      status: VOTE_STATUS[0] // InProgress
    })).not.toBeTrue();
    expect(isVotingClosed({
      ...vote,
      deadline: new Date('2777-07-07') // future deadline
    })).not.toBeTrue();
  });
});
