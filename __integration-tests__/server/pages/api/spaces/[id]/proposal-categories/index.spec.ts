import type { ProposalCategory, ProposalCategoryPermission, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { CreateProposalCategoryInput } from 'lib/proposal/createProposalCategory';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let space: Space;
let adminUser: User;
let memberUser: User;

let adminCookie: string;
let memberCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: generatedUser } = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });
  adminUser = generatedUser;
  memberUser = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: generatedSpace.id });
  space = generatedSpace;
  adminCookie = await loginUser(adminUser.id);
  memberCookie = await loginUser(memberUser.id);
});

describe('POST /api/spaces/[id]/proposal-categories - Create a proposal category', () => {
  it('Should allow an admin to create a proposal category, and provide its default permissions, responding 201', async () => {
    const proposalInput: CreateProposalCategoryInput = {
      spaceId: space.id,
      title: `New Proposal Category ${Math.random()}`
    };

    const proposalCategory = (await (
      await request(baseUrl)
        .post(`/api/spaces/${space.id}/proposal-categories`)
        .set('Cookie', adminCookie)
        .send(proposalInput)
        .expect(201)
    ).body) as ProposalCategory;

    expect(proposalCategory).toMatchObject<ProposalCategory>({
      color: expect.any(String),
      id: expect.any(String),
      spaceId: space.id,
      title: proposalInput.title
    });
  });

  it('should fail if the user is not an admin, responding with 401', async () => {
    const proposalInput: CreateProposalCategoryInput = {
      spaceId: space.id,
      title: 'New Proposal Category'
    };

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/proposal-categories`)
      .set('Cookie', memberCookie)
      .send(proposalInput)
      .expect(401);
  });
});
