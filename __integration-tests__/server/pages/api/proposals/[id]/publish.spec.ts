import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalWorkflow } from 'testing/utils/proposals';

let author: User;
let reviewer: User;
let space: Space;
let authorCookie: string;

beforeAll(async () => {
  const generated1 = await generateUserAndSpace(undefined);
  const generated2 = await generateUserAndSpace(undefined);
  author = generated1.user;
  reviewer = generated2.user;
  space = generated1.space;

  authorCookie = await loginUser(author.id);

  await prisma.spaceRole.create({
    data: {
      spaceId: space.id,
      userId: reviewer.id
    }
  });
});

describe('PUT /api/proposals/[id]/publish - Publish proposal', () => {
  it('should allow an admin to update the proposal status and return 200', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id
    });

    const adminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl).put(`/api/proposals/${proposal.id}/publish`).set('Cookie', adminCookie).send().expect(200);
  });

  it("should throw error and return 404 if the proposal doesn't exist", async () => {
    await request(baseUrl).put(`/api/proposals/${v4()}/status`).set('Cookie', authorCookie).send().expect(404);
  });

  it('should throw error and return 401 if the user cannot update the status', async () => {
    const spaceMember = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const spaceMemberCookie = await loginUser(spaceMember.id);

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id
    });

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/publish`)
      .set('Cookie', spaceMemberCookie)
      .send()
      .expect(401);
  });

  it('should return 400 if proposal is incomplete', async () => {
    // missing workflowId and authors
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id
    });

    await request(baseUrl).put(`/api/proposals/${proposal.id}/publish`).set('Cookie', authorCookie).send().expect(400);
  });

  it('should successfully update the status of proposal and return 200', async () => {
    const workflow = await generateProposalWorkflow({
      spaceId: space.id
    });
    const proposal = await testUtilsProposals.generateProposal({
      authors: [author.id],
      spaceId: space.id,
      userId: author.id,
      workflowId: workflow.id
    });

    await request(baseUrl).put(`/api/proposals/${proposal.id}/publish`).set('Cookie', authorCookie).send().expect(200);
  });
});
