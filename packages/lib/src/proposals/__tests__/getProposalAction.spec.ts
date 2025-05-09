import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import type { ProposalWithEvaluation } from '../getProposalAction';
import { getProposalAction } from '../getProposalAction';

describe('getProposalAction', () => {
  it(`Should return null if proposal is in draft status`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });

    const action = getProposalAction({
      proposal: {
        ...proposal,
        rewards: []
      },
      isAuthor: true,
      isReviewer: true,
      isVoter: true,
      canComment: true
    });

    expect(action).toBeNull();
  });

  it(`Should return 'reward_published' if the last step has been completed, proposal has rewards and user is an author`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const authorAction = getProposalAction({
      proposal: {
        ...proposal,
        rewards: [
          {
            id: v4()
          }
        ],
        evaluations: [
          {
            id: v4(),
            index: 0,
            type: 'feedback',
            result: 'pass'
          },
          {
            id: v4(),
            index: 1,
            type: 'rubric',
            result: 'pass'
          }
        ]
      },
      isAuthor: true,
      isReviewer: false,
      isVoter: false,
      canComment: false
    });

    expect(authorAction).toBe('reward_published');
  });

  it(`Should return 'proposal_passed' if the last step has been completed, proposal has no rewards and user is an author`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const authorAction = getProposalAction({
      proposal: {
        ...proposal,
        rewards: [],
        evaluations: [
          {
            id: v4(),
            index: 0,
            type: 'feedback',
            result: 'pass'
          },
          {
            id: v4(),
            index: 1,
            type: 'rubric',
            result: 'pass'
          }
        ]
      },
      isAuthor: true,
      isReviewer: false,
      isVoter: false,
      canComment: false
    });

    expect(authorAction).toBe('proposal_passed');
  });

  it(`Should return 'proposal_failed' if current step has failed and user is an author`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const authorAction = getProposalAction({
      proposal: {
        ...proposal,
        rewards: [],
        evaluations: [
          {
            id: v4(),
            index: 0,
            type: 'feedback',
            result: 'pass'
          },
          {
            id: v4(),
            index: 1,
            type: 'pass_fail',
            result: 'fail'
          }
        ]
      },
      isAuthor: true,
      isReviewer: false,
      isVoter: false,
      canComment: false
    });

    expect(authorAction).toBe('proposal_failed');
  });

  it(`Should return 'start_discussion' if current step is feedback and user can comment`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const memberAction = getProposalAction({
      proposal: {
        ...proposal,
        rewards: [],
        evaluations: [
          {
            id: v4(),
            index: 0,
            type: 'feedback',
            result: null
          },
          {
            id: v4(),
            index: 1,
            type: 'rubric',
            result: null
          }
        ]
      },
      isAuthor: false,
      isReviewer: false,
      isVoter: false,
      canComment: true
    });

    expect(memberAction).toBe('start_discussion');
  });

  it(`Should return 'vote' if current step is vote, vote is ongoing and user can vote`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const proposalWithEvaluation: ProposalWithEvaluation = {
      ...proposal,
      rewards: [],
      evaluations: [
        {
          id: v4(),
          index: 0,
          type: 'feedback',
          result: 'pass'
        },
        {
          id: v4(),
          index: 1,
          type: 'vote',
          result: null
        }
      ]
    };

    const voterAction = getProposalAction({
      proposal: proposalWithEvaluation,
      isAuthor: false,
      isReviewer: false,
      isVoter: true,
      canComment: false
    });

    expect(voterAction).toBe('vote');
  });

  it(`Should return 'review_required' if current step is reviewable, review is not yet completed and user is an reviewer`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const reviewerAction = getProposalAction({
      proposal: {
        ...proposal,
        rewards: [],
        evaluations: [
          {
            id: v4(),
            index: 0,
            type: 'feedback',
            result: 'pass'
          },
          {
            id: v4(),
            index: 1,
            type: 'pass_fail',
            result: 'pass'
          },
          {
            id: v4(),
            index: 2,
            type: 'rubric',
            result: null
          }
        ]
      },
      isAuthor: false,
      isReviewer: true,
      isVoter: false,
      canComment: false
    });

    expect(reviewerAction).toBe('review_required');
  });

  it(`Should return 'proposal_failed' if current step is reviewable, review step has failed and user is an author`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const authorAction = getProposalAction({
      proposal: {
        ...proposal,
        rewards: [],
        evaluations: [
          {
            id: v4(),
            index: 0,
            type: 'feedback',
            result: 'pass'
          },
          {
            id: v4(),
            index: 1,
            type: 'pass_fail',
            result: 'pass'
          },
          {
            id: v4(),
            index: 2,
            type: 'rubric',
            result: 'fail'
          }
        ]
      },
      isVoter: false,
      isReviewer: false,
      isAuthor: true,
      canComment: false
    });

    expect(authorAction).toBe('proposal_failed');
  });

  it(`Should return 'vote_passed' if current step is in progress, previous step is vote, vote has passed and user is an author or voter`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const proposalWithEvaluation: ProposalWithEvaluation = {
      ...proposal,
      rewards: [],
      evaluations: [
        {
          id: v4(),
          index: 0,
          type: 'vote',
          result: 'pass'
        },
        {
          id: v4(),
          index: 1,
          type: 'rubric',
          result: null
        }
      ]
    };

    const authorAction = getProposalAction({
      proposal: proposalWithEvaluation,
      isAuthor: true,
      isReviewer: false,
      isVoter: false,
      canComment: false
    });

    const voterAction = getProposalAction({
      proposal: proposalWithEvaluation,
      isAuthor: false,
      isReviewer: false,
      isVoter: true,
      canComment: false
    });

    expect(authorAction).toBe('vote_passed');
    expect(voterAction).toBe('vote_passed');
  });

  it(`Should return 'step_passed' if current step is in progress, previous step has passed and user is an author`, async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const authorAction = getProposalAction({
      proposal: {
        ...proposal,
        rewards: [],
        evaluations: [
          {
            id: v4(),
            index: 0,
            type: 'feedback',
            result: 'pass'
          },
          {
            id: v4(),
            index: 1,
            type: 'pass_fail',
            result: 'pass'
          },
          {
            id: v4(),
            index: 2,
            type: 'rubric',
            result: null
          }
        ]
      },
      isAuthor: true,
      isReviewer: false,
      isVoter: false,
      canComment: false
    });

    expect(authorAction).toBe('step_passed');
  });
});
