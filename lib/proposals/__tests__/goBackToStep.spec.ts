import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { createVote, generateBounty } from 'testing/setupDatabase';

import { goBackToStep } from '../goBackToStep';

describe('goBackToStep()', () => {
  it('should return a proposal to draft state', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          result: 'pass',
          reviewers: [],
          permissions: []
        }
      ]
    });

    await goBackToStep({
      proposalId: proposal.id,
      evaluationId: 'draft',
      userId: user.id
    });

    const updated = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    });
    expect(updated.status).toBe('draft');
    expect(updated.evaluations[0].result).toBe(null);
  });

  it('should clear the result from the step', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          result: 'pass',
          reviewers: [],
          permissions: []
        }
      ]
    });

    await goBackToStep({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      userId: user.id
    });

    const updated = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    });
    expect(updated.status).toBe('published');
    expect(updated.evaluations[0].result).toBe(null);
  });

  // this can happen when the last step is completed, and the current evaluation will have a result
  it('should clear the result from the current step', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          result: 'pass',
          reviewers: [],
          permissions: []
        },
        {
          evaluationType: 'pass_fail',
          title: 'Review',
          result: 'pass',
          reviewers: [],
          permissions: []
        }
      ]
    });

    await goBackToStep({
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      userId: user.id
    });

    const updated = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    });
    expect(updated.evaluations[0].result).toBe(null);
    expect(updated.evaluations[1].result).toBe(null);
  });

  it('should delete the vote from the current step', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const vote = await createVote({
      createdBy: user.id,
      spaceId: space.id
    });
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Review',
          result: 'pass',
          reviewers: [],
          permissions: []
        },
        {
          evaluationType: 'vote',
          title: 'Vote step',
          reviewers: [],
          permissions: [],
          voteId: vote.id
        }
      ]
    });

    await goBackToStep({
      proposalId: proposal.id,
      // go back to 'feedback' step
      evaluationId: proposal.evaluations[0].id,
      userId: user.id
    });

    const updated = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    });
    expect(updated.status).toBe('published');
    expect(updated.evaluations[1].voteId).toBe(null);
    const voteExists = await prisma.vote.count({
      where: {
        id: vote.id
      }
    });
    expect(voteExists).toBe(0);
  });

  it('should delete the vote from an active vote step when going backward', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const vote = await createVote({
      createdBy: user.id,
      spaceId: space.id
    });
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Review',
          result: 'pass',
          reviewers: [],
          permissions: []
        },
        {
          evaluationType: 'vote',
          title: 'Vote step',
          reviewers: [],
          permissions: [],
          voteId: vote.id
        }
      ]
    });

    await goBackToStep({
      proposalId: proposal.id,
      // go back to 'feedback' step
      evaluationId: proposal.evaluations[0].id,
      userId: user.id
    });

    const updated = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      include: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    });
    expect(updated.status).toBe('published');
    expect(updated.evaluations[1].voteId).toBe(null);
    const voteExists = await prisma.vote.count({
      where: {
        id: vote.id
      }
    });
    expect(voteExists).toBe(0);
  });

  it('should throw an error if the vote step was completed', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const vote = await createVote({
      createdBy: user.id,
      spaceId: space.id
    });
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          title: 'Vote step',
          reviewers: [],
          permissions: [],
          voteId: vote.id,
          result: 'pass'
        }
      ]
    });

    await expect(
      goBackToStep({
        proposalId: proposal.id,
        // go back to 'feedback' step
        evaluationId: proposal.evaluations[0].id,
        userId: user.id
      })
    ).rejects.toThrow();
  });

  it('should throw an error if there are rewards', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const vote = await createVote({
      createdBy: user.id,
      spaceId: space.id
    });
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          title: 'Review',
          reviewers: [],
          permissions: [],
          voteId: vote.id,
          result: 'pass'
        }
      ]
    });

    await generateBounty({
      proposalId: proposal.id,
      createdBy: user.id,
      spaceId: space.id
    });

    await expect(
      goBackToStep({
        proposalId: proposal.id,
        // go back to 'feedback' step
        evaluationId: proposal.evaluations[0].id,
        userId: user.id
      })
    ).rejects.toThrow();
  });
});
