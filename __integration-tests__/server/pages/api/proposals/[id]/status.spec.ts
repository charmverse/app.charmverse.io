import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createProposalWithUsers, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

let author: User;
let reviewer: User;
let space: Space;
let authorCookie: string;
let reviewerCookie: string;

beforeAll(async () => {
  const generated1 = await generateUserAndSpace(undefined);
  const generated2 = await generateUserAndSpace(undefined);
  author = generated1.user;
  reviewer = generated2.user;
  space = generated1.space;

  authorCookie = await loginUser(author.id);

  reviewerCookie = await loginUser(reviewer.id);

  await prisma.spaceRole.create({
    data: {
      spaceId: space.id,
      userId: reviewer.id
    }
  });
});

describe('PUT /api/proposals/[id]/status - Update proposal status', () => {
  it('should allow an admin to update the proposal status and return 200', async () => {
    const proposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    const adminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/status`)
      .set('Cookie', adminCookie)
      .send({
        newStatus: 'discussion'
      })
      .expect(200);
  });
  it('should throw error and return 400 if the newStatus is not passed in body', async () => {
    const proposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    await request(baseUrl).put(`/api/proposals/${proposal.id}/status`).set('Cookie', reviewerCookie).expect(400);
  });

  it("should throw error and return 404 if the proposal doesn't exist", async () => {
    await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    await request(baseUrl)
      .put(`/api/proposals/${v4()}/status`)
      .set('Cookie', authorCookie)
      .send({
        newStatus: 'draft'
      })
      .expect(404);
  });

  it('should throw error and return 400 if the user cannot update the status', async () => {
    const spaceMember = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const spaceMemberCookie = await loginUser(spaceMember.id);

    const proposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/status`)
      .set('Cookie', spaceMemberCookie)
      .send({
        newStatus: 'draft'
      })
      .expect(400);
  });

  it('should successfully update the status of proposal and return 200', async () => {
    const proposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'discussion',
      authors: [],
      reviewers: [reviewer.id]
    });

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/status`)
      .set('Cookie', authorCookie)
      .send({
        newStatus: 'draft'
      })
      .expect(200);
  });
});
