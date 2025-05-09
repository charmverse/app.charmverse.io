import type { Space, SuperApiToken, User } from '@charmverse/core/prisma';
import type { PageComment, Proposal, SpaceApiToken } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateSpaceApiKey, generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import request from 'supertest';

import type { PublicApiProposalComment } from 'pages/api/v1/proposals/[proposalId]/comments';

describe('PUT /api/v1/proposals/{proposalId}/comments/{commentId}', () => {
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
        user: { connect: { id: user.id } },
        votes: {
          create: {
            createdBy: user.id,
            upvoted: true
          }
        }
      }
    });
  });

  it('should fail to update a comment when called with a spaceAPI key', async () => {
    await request(baseUrl)
      .put(`/api/v1/proposals/${proposal.id}/comments/${proposalComment.id}`)
      .set({ authorization: `Bearer ${spaceApiKey.token}` })
      .send({ userId: user.id, contentMarkdown: 'New' })
      .expect(401);
  });

  it('should update a comment when called with a superAPI key', async () => {
    const newContent = 'New content';

    const comment = (
      await request(baseUrl)
        .put(`/api/v1/proposals/${proposal.id}/comments/${proposalComment.id}`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send({ userId: user.id, contentMarkdown: newContent })
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
        markdown: newContent,
        text: newContent
      },
      children: []
    });
  });

  it('should fail to update a comment for a proposal in a different space', async () => {
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
      .put(`/api/v1/proposals/${otherSpaceProposal.id}/comments/${otherSpaceProposalComment.id}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send({ userId: user.id, contentMarkdown: 'new' })
      .expect(404);
  });
});
