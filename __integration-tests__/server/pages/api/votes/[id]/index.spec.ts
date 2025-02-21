import type { Page, Space, Vote } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@packages/profile/getUser';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import {
  createPage,
  createVote,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 } from 'uuid';

let page: Page;
let space: Space;
let user: LoggedInUser;
let vote: Vote;

let userCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: generatedUser } = await generateUserAndSpaceWithApiToken(undefined, false);
  user = generatedUser;
  space = generatedSpace;

  page = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    pagePermissions: [{ permissionLevel: 'full_access', spaceId: space.id }]
  });

  vote = await createVote({
    createdBy: user.id,
    pageId: page.id,
    spaceId: space.id,
    voteOptions: ['3', '4'],
    userVotes: ['3']
  });

  userCookie = await loginUser(user.id);
});

describe('GET /api/votes/[id] - Get a single vote', () => {
  it('Should get vote and respond 200', async () => {
    await request(baseUrl).get(`/api/votes/${vote.id}`).set('Cookie', userCookie).expect(200);
  });

  it("Should fail if vote doesn't exist and respond 404", async () => {
    await request(baseUrl).get(`/api/votes/${v4()}`).set('Cookie', userCookie).expect(404);
  });
});

describe('PUT /api/votes/[id] - Update a single vote', () => {
  it('Should update vote if the user has create_poll permission for the page and respond 200', async () => {
    const nonAdminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    const nonAdminCookie = await loginUser(nonAdminUser.id);
    const votePage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'custom',
          permissions: ['create_poll'],
          userId: nonAdminUser.id
        }
      ]
    });

    const targetVote = await createVote({
      createdBy: user.id,
      pageId: votePage.id,
      spaceId: space.id,
      voteOptions: ['3', '4'],
      userVotes: ['3']
    });

    await request(baseUrl)
      .put(`/api/votes/${targetVote.id}`)
      .set('Cookie', nonAdminCookie)
      .send({
        status: 'Cancelled'
      })
      .expect(200);
  });

  it('Should update vote if the user is an admin of the page space and respond 200', async () => {
    const adminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);
    const votePage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const targetVote = await createVote({
      createdBy: user.id,
      pageId: votePage.id,
      spaceId: space.id,
      voteOptions: ['3', '4'],
      userVotes: ['3']
    });

    await request(baseUrl)
      .put(`/api/votes/${targetVote.id}`)
      .set('Cookie', adminCookie)
      .send({
        status: 'Cancelled'
      })
      .expect(200);
  });

  it('Should not update vote if the user does not have create_poll permission for the page and respond 200', async () => {
    const nonAdminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    const nonAdminCookie = await loginUser(nonAdminUser.id);
    const votePage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const targetVote = await createVote({
      createdBy: user.id,
      pageId: votePage.id,
      spaceId: space.id,
      voteOptions: ['3', '4'],
      userVotes: ['3']
    });

    await request(baseUrl)
      .put(`/api/votes/${targetVote.id}`)
      .set('Cookie', nonAdminCookie)
      .send({
        status: 'Cancelled'
      })
      .expect(401);
  });
});

describe('DELETE /api/votes/[id] - Delete a single vote', () => {
  it('Should delete vote if the user has create_poll permission for the page and respond 200', async () => {
    const nonAdminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    const nonAdminCookie = await loginUser(nonAdminUser.id);
    const votePage = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'custom',
          permissions: ['create_poll'],
          userId: nonAdminUser.id
        }
      ]
    });

    const targetVote = await createVote({
      createdBy: user.id,
      pageId: votePage.id,
      spaceId: space.id,
      voteOptions: ['3', '4'],
      userVotes: ['3']
    });

    await request(baseUrl).delete(`/api/votes/${targetVote.id}`).set('Cookie', nonAdminCookie).expect(200);
  });

  it('Should update vote if the user is an admin of the page space and respond 200', async () => {
    const adminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);
    const votePage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const targetVote = await createVote({
      createdBy: user.id,
      pageId: votePage.id,
      spaceId: space.id,
      voteOptions: ['3', '4'],
      userVotes: ['3']
    });

    await request(baseUrl)
      .delete(`/api/votes/${targetVote.id}`)
      .set('Cookie', adminCookie)
      .query({
        status: 'Cancelled'
      })
      .expect(200);
  });

  it('Should not update vote if the user does not have create_poll permission for the page and respond 200', async () => {
    const nonAdminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
    const nonAdminCookie = await loginUser(nonAdminUser.id);
    const votePage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const targetVote = await createVote({
      createdBy: user.id,
      pageId: votePage.id,
      spaceId: space.id,
      voteOptions: ['3', '4'],
      userVotes: ['3']
    });

    await request(baseUrl)
      .delete(`/api/votes/${targetVote.id}`)
      .set('Cookie', nonAdminCookie)
      .query({
        status: 'Cancelled'
      })
      .expect(401);
  });
});
