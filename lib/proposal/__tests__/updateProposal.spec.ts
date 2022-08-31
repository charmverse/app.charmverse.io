import { User, Space } from '@prisma/client';
import { createProposalWithUsers, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { updateProposal } from '../updateProposal';
import { ProposalWithUsers } from '../interface';

let author1: User;
let author2: User;
let reviewer1: User;
let reviewer2: User;
let space: Space;

beforeAll(async () => {
  const { user: user1, space: generatedSpace } = await generateUserAndSpaceWithApiToken();
  const { user: user2 } = await generateUserAndSpaceWithApiToken();
  const { user: user3 } = await generateUserAndSpaceWithApiToken();
  const { user: user4 } = await generateUserAndSpaceWithApiToken();

  author1 = user1;
  author2 = user2;
  reviewer1 = user3;
  reviewer2 = user4;
  space = generatedSpace;
});

describe('Update proposal specific data', () => {
  it('Update the reviewers and authors list of a proposal', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer2.id]
    });

    const proposal = pageWithProposal.proposal as ProposalWithUsers;

    await updateProposal({
      proposal,
      authors: [author2.id],
      reviewers: [{
        group: 'user',
        id: reviewer1.id
      }]
    });

    const [proposalReviewer1, proposalReviewer2, proposalAuthor1, proposalAuthor2] = await Promise.all([
      prisma.proposalReviewer.findUnique({
        where: {
          userId_proposalId: {
            proposalId: proposal.id,
            userId: reviewer1.id
          }
        }
      }),
      prisma.proposalReviewer.findUnique({
        where: {
          userId_proposalId: {
            proposalId: proposal.id,
            userId: reviewer2.id
          }
        }
      }),
      prisma.proposalAuthor.findUnique({
        where: {
          proposalId_userId: {
            proposalId: proposal.id,
            userId: author1.id
          }
        }
      }),
      prisma.proposalAuthor.findUnique({
        where: {
          proposalId_userId: {
            proposalId: proposal.id,
            userId: author2.id
          }
        }
      })
    ]);

    // This records should be deleted
    expect(proposalReviewer2).toBeFalsy();
    expect(proposalAuthor1).toBeFalsy();

    // This records should be created
    expect(proposalReviewer1).toBeTruthy();
    expect(proposalAuthor2).toBeTruthy();
  });

  it('Should throw error if atleast one author is not selected for a proposal', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer2.id]
    });

    const proposal = pageWithProposal.proposal as ProposalWithUsers;

    await expect(updateProposal({
      proposal,
      authors: [],
      reviewers: [{
        group: 'user',
        id: reviewer1.id
      }]
    })).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('Should throw error if authors are updated when proposal is in review', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      proposalStatus: 'review',
      reviewers: [reviewer2.id]
    });

    const proposal = pageWithProposal.proposal as ProposalWithUsers;

    await expect(updateProposal({
      proposal,
      authors: [reviewer1.id],
      reviewers: []
    })).rejects.toBeInstanceOf(UnauthorisedActionError);
  });

  it('Should throw error if reviewers are updated when proposal is in discussion', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      proposalStatus: 'discussion',
      reviewers: [reviewer2.id]
    });

    const proposal = pageWithProposal.proposal as ProposalWithUsers;

    await expect(updateProposal({
      proposal,
      authors: [author1.id],
      reviewers: [{
        group: 'user',
        id: reviewer1.id
      }]
    })).rejects.toBeInstanceOf(UnauthorisedActionError);
  });

});
