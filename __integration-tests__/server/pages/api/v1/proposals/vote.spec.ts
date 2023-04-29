import { prisma } from '@charmverse/core';
import type { Space, User, Vote } from '@charmverse/core/dist/prisma';
import request from 'supertest';
import { v4 } from 'uuid';

import type { PageWithProposal } from 'lib/pages';
import type { PublicApiProposal } from 'pages/api/v1/proposals';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpace, createProposalWithUsers, createVote } from 'testing/setupDatabase';

let user: User;
let space: Space;
let proposal: PageWithProposal;
let vote: Vote;

async function getUserVotes(voteId: string) {
  const currentVote = await prisma.vote.findUnique({ where: { id: voteId }, include: { userVotes: true } });

  return currentVote?.userVotes || [];
}

describe('POST /api/v1/proposals/vote', () => {
  beforeEach(async () => {
    const generated = await generateUserAndSpace();
    user = generated.user;
    space = generated.space;

    proposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [user.id],
      proposalStatus: 'vote_active'
    });

    vote = await createVote({
      pageId: proposal.id,
      createdBy: user.id,
      spaceId: space.id,
      voteOptions: ['1', '2', '3']
    });
  });

  it('should cast a vote and return user vote data to the user when called with API key', async () => {
    const normalApiToken = await prisma.spaceApiToken.create({
      data: {
        token: v4(),
        space: { connect: { id: space.id } }
      }
    });

    const votes = await getUserVotes(vote.id);
    expect(votes).toHaveLength(0);

    const response = (
      await request(baseUrl)
        .post(`/api/v1/proposals/vote?api_key=${normalApiToken.token}`)
        .send({
          proposalId: proposal.id,
          userId: user.id,
          choice: '1'
        })
        .expect(200)
    ).body as PublicApiProposal[];

    expect(response).toMatchObject(
      expect.objectContaining({
        voteId: vote.id,
        userId: user.id,
        choice: '1'
      })
    );

    const userVotes = await getUserVotes(vote.id);
    expect(userVotes).toHaveLength(1);
    expect(userVotes[0].choice).toBe('1');
    expect(userVotes[0].userId).toBe(user.id);
  });

  it('should cast a vote and return user vote data to the user when called with a super API key', async () => {
    const superApiKey = await prisma.superApiToken.create({
      data: {
        token: v4(),
        name: `test-super-api-key-${v4()}`,
        spaces: { connect: { id: space.id } }
      }
    });

    const votes = await getUserVotes(vote.id);
    expect(votes).toHaveLength(0);

    const response = (
      await request(baseUrl)
        .post(`/api/v1/proposals/vote?spaceId=${space.id}`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send({
          proposalId: proposal.id,
          userId: user.id,
          choice: '1'
        })
        .expect(200)
    ).body as PublicApiProposal[];

    expect(response).toMatchObject(
      expect.objectContaining({
        voteId: vote.id,
        userId: user.id,
        choice: '1'
      })
    );

    const userVotes = await getUserVotes(vote.id);
    expect(userVotes).toHaveLength(1);
    expect(userVotes[0].choice).toBe('1');
    expect(userVotes[0].userId).toBe(user.id);
  });

  it('should fail if the requester super API key is not linked to this space', async () => {
    const otherSuperApiKey = await prisma.superApiToken.create({
      data: {
        token: v4(),
        name: `test-super-api-key-${v4()}`
      }
    });

    await request(baseUrl)
      .post(`/api/v1/proposals/vote?spaceId=${space.id}`)
      .set({ authorization: `Bearer ${otherSuperApiKey.token}` })
      .send({
        proposalId: proposal.id,
        userId: user.id,
        choice: '1'
      })
      .expect(401);
  });

  it('should fail if incomplete or incorrect vote data is provided', async () => {
    const superApiKey = await prisma.superApiToken.create({
      data: {
        token: v4(),
        name: `test-super-api-key-${v4()}`,
        spaces: { connect: { id: space.id } }
      }
    });

    await request(baseUrl)
      .post(`/api/v1/proposals/vote?spaceId=${space.id}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send({
        proposalId: v4(),
        userId: user.id,
        choice: '1'
      })
      .expect(404);

    await request(baseUrl)
      .post(`/api/v1/proposals/vote?spaceId=${space.id}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send({
        proposalId: proposal.id,
        userId: v4(),
        choice: '1'
      })
      .expect(401);

    await request(baseUrl)
      .post(`/api/v1/proposals/vote?spaceId=${space.id}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send({
        proposalId: proposal.id,
        userId: user.id,
        choice: '12'
      })
      .expect(400);

    await request(baseUrl)
      .post(`/api/v1/proposals/vote?spaceId=${space.id}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send({})
      .expect(400);
  });
});
