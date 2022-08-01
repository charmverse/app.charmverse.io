/* eslint-disable @typescript-eslint/no-unused-vars */
import { Bounty, Prisma, Proposal, Space, User } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { createBounty } from 'lib/bounties';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { prisma } from 'db';
import { PageWithProposal } from 'lib/proposals/interfaces';

let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;

});

describe('POST /api/proposals - create a bounty', () => {

  it('should allow users with the create page permission to create a proposal, and respond 201', async () => {

    const nonAdminUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const creationContent = {
      spaceId: space.id
    };

    const cookie = await loginUser(nonAdminUser);

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createPage'],
      userId: nonAdminUser.id
    });

    const createdProposal = (await request(baseUrl)
      .post('/api/proposals')
      .set('Cookie', cookie)
      .send(creationContent)
      .expect(201)).body;

    expect(createdProposal).toEqual(
      expect.objectContaining<Partial<PageWithProposal>>({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        type: 'proposal',
        proposal: expect.objectContaining<Partial<Proposal>>({
          status: 'draft'
        }),
        permissions: expect.arrayContaining([])
      })
    );

  });

  it('should prevent users without the create page permission from creating a proposal, and respond 401', async () => {

    const nonAdminUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const creationContent = {
      spaceId: space.id
    };

    const cookie = await loginUser(nonAdminUser);

    await request(baseUrl)
      .post('/api/proposals')
      .set('Cookie', cookie)
      .send(creationContent)
      .expect(401);

  });

});
