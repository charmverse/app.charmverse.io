import { Space, User } from '@prisma/client';
import { upsertPermission } from 'lib/permissions/pages';
import { ProposalWithUsers } from 'lib/proposal/interface';
import request from 'supertest';
import { baseUrl } from 'testing/mockApiCall';
import { createProposalWithUsers, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';

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

  authorCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: author.addresses[0]
    })).headers['set-cookie'][0];

  reviewerCookie = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: reviewer.addresses[0]
    })).headers['set-cookie'][0];

  await prisma.spaceRole.create({
    data: {
      spaceId: space.id,
      userId: reviewer.id
    }
  });
});

describe('GET /api/proposals/[id] - Get proposal', () => {
  it('should return the proposal with the author and reviewers', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    await upsertPermission(pageWithProposal.id, {
      permissionLevel: 'full_access',
      pageId: pageWithProposal.id,
      userId: author.id
    });

    const proposal = (await request(baseUrl)
      .get(`/api/proposals/${pageWithProposal.proposalId}`)
      .set('Cookie', authorCookie)
      .expect(200)).body as ProposalWithUsers;

    expect(proposal).toMatchObject(expect.objectContaining({
      id: expect.any(String),
      spaceId: space.id,
      createdBy: author.id,
      status: 'draft',
      authors: expect.arrayContaining([
        expect.objectContaining({
          proposalId: pageWithProposal.proposalId,
          userId: author.id
        })
      ]),
      reviewers: [
        expect.objectContaining({
          id: expect.any(String),
          roleId: null,
          proposalId: pageWithProposal.proposalId,
          userId: reviewer.id
        })
      ]
    }));
  });

  it('should throw error if proposal doesn\'t exist', async () => {
    await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    (await request(baseUrl)
      .get(`/api/proposals/${v4()}`)
      .set('Cookie', authorCookie)
      .expect(404));
  });

  it('should throw error if user doesn\'t have read access to proposal page', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer.id]
    });

    (await request(baseUrl)
      .get(`/api/proposals/${pageWithProposal.proposalId}`)
      .set('Cookie', reviewerCookie)
      .expect(404));
  });
});
