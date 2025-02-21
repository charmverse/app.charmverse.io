import type { Space, SuperApiToken, User } from '@charmverse/core/prisma';
import type { PageComment, Proposal, SpaceApiToken } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateSpaceApiKey, generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import request from 'supertest';

describe('DELETE /api/v1/proposals/{proposalId}/comments/{commentId}', () => {
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

  it('should fail to delete a comment when called with a spaceAPI key', async () => {
    await request(baseUrl)
      .delete(`/api/v1/proposals/${proposal.id}/comments/${proposalComment.id}`)
      .set({ authorization: `Bearer ${spaceApiKey.token}` })
      .send()
      .expect(401);
  });

  it('should delete a comment when called with a superAPI key', async () => {
    await request(baseUrl)
      .delete(`/api/v1/proposals/${proposal.id}/comments/${proposalComment.id}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send()
      .expect(200);

    const comment = await prisma.pageComment.findUnique({
      where: {
        id: proposalComment.id
      }
    });

    expect(comment).toBeNull();
  });

  it('should fail to delete a comment for a proposal in a different space', async () => {
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
      .delete(`/api/v1/proposals/${otherSpaceProposal.id}/comments/${otherSpaceProposalComment.id}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send()
      .expect(404);
  });
});
