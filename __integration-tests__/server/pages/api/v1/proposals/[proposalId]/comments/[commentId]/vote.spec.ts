import type { Space, SuperApiToken, User } from '@charmverse/core/prisma';
import type { PageComment, Proposal, SpaceApiToken } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateSpaceApiKey, generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import request from 'supertest';

import type { PublicApiProposalComment } from 'pages/api/v1/proposals/[proposalId]/comments';

describe('POST /api/v1/proposals/{proposalId}/comments/{commentId}/vote', () => {
  let space: Space;
  let user: User;
  let proposal: Proposal;
  let proposalComment: PageComment;
  let spaceApiKey: SpaceApiToken;
  let superApiKey: SuperApiToken;
  const commentText = 'Comment';

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    space = generated.space;
    user = generated.user;
    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });
    spaceApiKey = await generateSpaceApiKey({
      spaceId: space.id
    });
    superApiKey = await generateSuperApiKey({
      spaceId: space.id
    });
    proposalComment = await prisma.pageComment.create({
      data: {
        content: stubProsemirrorDoc({ text: commentText }),
        contentText: commentText,
        page: { connect: { id: proposal.id } },
        user: { connect: { id: user.id } }
      }
    });
  });

  it('should fail to create a comment vote when called with a spaceAPI key', async () => {
    await request(baseUrl)
      .post(`/api/v1/proposals/${proposal.id}/comments/${proposalComment.id}/vote`)
      .set({ authorization: `Bearer ${spaceApiKey.token}` })
      .send({ userId: user.id, upvoted: true })
      .expect(401);
  });

  it('should create a comment vote or update an existing one when called with a superAPI key', async () => {
    const comment = (
      await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/comments/${proposalComment.id}/vote`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send({ userId: user.id, upvoted: true })
        .expect(200)
    ).body;

    expect(comment).toMatchObject<PublicApiProposalComment>({
      id: expect.any(String),
      parentId: null,
      createdAt: expect.any(String),
      createdBy: user.id,
      upvotes: 1,
      downvotes: 0,
      content: {
        markdown: commentText,
        text: commentText
      },
      children: []
    });
    const updatedComment = (
      await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/comments/${proposalComment.id}/vote`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send({ userId: user.id, upvoted: false })
        .expect(200)
    ).body;

    expect(updatedComment).toMatchObject<PublicApiProposalComment>({
      id: expect.any(String),
      parentId: null,
      createdAt: expect.any(String),
      createdBy: user.id,
      upvotes: 0,
      downvotes: 1,
      content: {
        markdown: commentText,
        text: commentText
      },
      children: []
    });
  });

  it('should delete a comment vote when called with a superAPI key if the value of upvoted is null', async () => {
    const comment = await prisma.pageComment.create({
      data: {
        content: stubProsemirrorDoc({ text: commentText }),
        contentText: commentText,
        page: { connect: { id: proposal.id } },
        user: { connect: { id: user.id } },
        votes: {
          create: {
            createdBy: user.id,
            upvoted: true
          }
        }
      },
      select: {
        id: true,
        votes: true
      }
    });

    const updatedComment = (
      await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/comments/${comment.id}/vote`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send({ userId: user.id, upvoted: null })
        .expect(200)
    ).body;

    expect(updatedComment).toMatchObject<PublicApiProposalComment>({
      id: expect.any(String),
      parentId: null,
      createdAt: expect.any(String),
      createdBy: user.id,
      upvotes: 0,
      downvotes: 0,
      content: {
        markdown: commentText,
        text: commentText
      },
      children: []
    });
  });

  it('should fail to create a comment for a proposal in a different space', async () => {
    const { user: otherSpaceUser, space: otherSpace } = await testUtilsUser.generateUserAndSpace();

    const otherSpaceProposal = await testUtilsProposals.generateProposal({
      spaceId: otherSpace.id,
      userId: otherSpaceUser.id
    });

    const otherSpaceProposalComment = await prisma.pageComment.create({
      data: {
        content: stubProsemirrorDoc({ text: commentText }),
        contentText: commentText,
        page: { connect: { id: otherSpaceProposal.id } },
        user: { connect: { id: otherSpaceUser.id } }
      }
    });

    await request(baseUrl)
      .post(`/api/v1/proposals/${otherSpaceProposal.id}/comments/${otherSpaceProposalComment.id}/vote`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send({ userId: user.id, upvoted: false })
      .expect(404);
  });
});
