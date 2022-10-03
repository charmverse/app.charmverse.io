import type { Space, User } from '@prisma/client';
import { prisma } from 'db';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createProposalWithUsers, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';

let author: User;
let reviewer: User;
let space: Space;
let authorCookie: string;
let reviewerCookie: string;

beforeAll(async () => {
  const generated1 = await generateUserAndSpaceWithApiToken(undefined, false);
  const generated2 = await generateUserAndSpaceWithApiToken(undefined, false);
  author = generated1.user;
  reviewer = generated2.user;
  space = generated1.space;

  authorCookie = await loginUser(author);

  reviewerCookie = await loginUser(reviewer);

  await prisma.spaceRole.create({
    data: {
      spaceId: space.id,
      userId: reviewer.id
    }
  });
});

describe('PUT /api/proposals/[id]/status - Update proposal status', () => {

  it('should allow an admin to update the proposal status and return 200', async () => {
    const proposalPage = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    const adminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: true });
    const adminCookie = await loginUser(adminUser);

    (await request(baseUrl)
      .put(`/api/proposals/${proposalPage.proposalId}/status`)
      .set('Cookie', adminCookie)
      .send({
        newStatus: 'discussion'
      })
      .expect(200));
  });
  it('should throw error and return 400 if the newStatus is not passed in body', async () => {
    const proposalPage = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    (await request(baseUrl)
      .put(`/api/proposals/${proposalPage.proposalId}/status`)
      .set('Cookie', reviewerCookie)
      .expect(400));
  });

  it('should throw error and return 404 if the proposal doesn\'t exist', async () => {
    await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    (await request(baseUrl)
      .put(`/api/proposals/${v4()}/status`)
      .set('Cookie', authorCookie)
      .send({
        newStatus: 'draft'
      })
      .expect(404));
  });

  it('should throw error and return 401 if the author is not the one updating the status', async () => {
    const proposalPage = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    (await request(baseUrl)
      .put(`/api/proposals/${proposalPage.proposalId}/status`)
      .set('Cookie', reviewerCookie)
      .send({
        newStatus: 'draft'
      })
      .expect(401));
  });

  it('should successfully update the status of proposal and return 200', async () => {
    const proposalPage = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    (await request(baseUrl)
      .put(`/api/proposals/${proposalPage.proposalId}/status`)
      .set('Cookie', authorCookie)
      .send({
        newStatus: 'draft'
      })
      .expect(200));
  });
});
