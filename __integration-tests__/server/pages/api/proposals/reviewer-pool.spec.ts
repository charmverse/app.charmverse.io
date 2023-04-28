import type { Role, Space, User } from '@charmverse/core/dist/prisma';
import request from 'supertest';

import { addSpaceOperations } from 'lib/permissions/spaces';
import type { ProposalReviewerPool } from 'lib/proposal/getProposalReviewerPool';
import { createUserFromWallet } from 'lib/users/createUser';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: false });
  space = generated.space;
  user = generated.user;
  await addSpaceOperations({
    forSpaceId: space.id,
    spaceId: space.id,
    operations: ['reviewProposals']
  });
});

describe('GET /api/proposals/reviewer-pool - Return eligible reviewers', () => {
  it('should return eligible reviewers if user is a space member and respond with 200', async () => {
    const nonAdminCookie = await loginUser(user.id);

    const pool = (
      await request(baseUrl)
        .get(`/api/proposals/reviewer-pool?spaceId=${space.id}`)
        .set('Cookie', nonAdminCookie)
        .send()
        .expect(200)
    ).body as ProposalReviewerPool;

    expect(pool.space).toBe(true);
    expect(pool.roles).toEqual([]);
  });

  it('should not return eligible reviewers if user is not a space member and respond with 401', async () => {
    const outsideUser = await createUserFromWallet({
      address: randomETHWalletAddress()
    });
    const outsideUserCookie = await loginUser(outsideUser.id);

    await request(baseUrl)
      .get(`/api/proposals/reviewer-pool?spaceId=${space.id}`)
      .set('Cookie', outsideUserCookie)
      .send()
      .expect(401);
  });
});
