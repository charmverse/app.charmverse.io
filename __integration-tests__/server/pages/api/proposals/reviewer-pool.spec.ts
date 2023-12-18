import type { ProposalReviewerPool } from '@charmverse/core/permissions';
import type { Proposal, Role, Space, User } from '@charmverse/core/prisma';
import request from 'supertest';

import { permissionsApiClient } from 'lib/permissions/api/routers';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { createUserFromWallet } from 'lib/users/createUser';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

let space: Space;
let user: User;
let proposal: Proposal;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: false });
  space = generated.space;
  user = generated.user;
  const proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
  proposal = await generateProposal({
    categoryId: proposalCategory.id,
    spaceId: space.id,
    userId: user.id
  });
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
        .get(`/api/proposals/reviewer-pool?resourceId=${proposal.categoryId}`)
        .set('Cookie', nonAdminCookie)
        .send()
        .expect(200)
    ).body as ProposalReviewerPool;

    const computed = await permissionsApiClient.proposals.getProposalReviewerPool({
      resourceId: proposal.categoryId as string
    });

    expect(pool.userIds).toEqual(expect.arrayContaining(computed.userIds));
    expect(pool.roleIds).toEqual(expect.arrayContaining(computed.roleIds));
  });

  it('should not return eligible reviewers if user is not a space member and respond with 401', async () => {
    const outsideUser = await createUserFromWallet({
      address: randomETHWalletAddress()
    });
    const outsideUserCookie = await loginUser(outsideUser.id);

    await request(baseUrl)
      .get(`/api/proposals/reviewer-pool?resourceId=${proposal.categoryId}`)
      .set('Cookie', outsideUserCookie)
      .send()
      .expect(401);
  });
});
