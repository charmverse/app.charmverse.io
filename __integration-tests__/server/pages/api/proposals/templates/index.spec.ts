import type { Space } from '@prisma/client';
import type { PageWithProposal } from 'lib/pages';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import type { LoggedInUser } from 'models';

let adminUser: LoggedInUser;
let nonAdminUser: LoggedInUser;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);

  adminUser = generated.user;
  space = generated.space;

  nonAdminUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

});

describe('POST /api/proposals/templates - Create a proposal from a template', () => {
  it('should create a proposal template if the user is a space admin and respond with 201', async () => {

    const adminCookie = await loginUser(adminUser.wallets[0].address);

    const proposalTemplate = (await request(baseUrl)
      .post('/api/proposals/templates')
      .set('Cookie', adminCookie)
      .send({
        spaceId: space.id
      })
      .expect(201)).body as PageWithProposal;

    expect(proposalTemplate.type === 'proposal_template').toBe(true);
  });

  it('should fail if the user is not a space admin and respond with 401', async () => {

    const nonAdminCookie = await loginUser(nonAdminUser.wallets[0].address);

    await request(baseUrl)
      .post('/api/proposals/templates')
      .set('Cookie', nonAdminCookie)
      .send({
        spaceId: space.id
      })
      .expect(401);
  });

});
