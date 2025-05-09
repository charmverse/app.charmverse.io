import type { Space } from '@charmverse/core/prisma';
import type { Proposal, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

describe('POST /api/proposals/[id]/archive - Archive and unarchive proposal', () => {
  let author: User;
  let spaceMember: User;
  let space: Space;
  let proposal: Proposal;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({});
    space = generated.space;
    author = generated.user;

    spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id
    });
  });

  it('should allow a user with permissions to archive the proposal and return 200', async () => {
    const authorCookie = await loginUser(author.id);

    await request(baseUrl)
      .post(`/api/proposals/${proposal.id}/archive`)
      .set('Cookie', authorCookie)
      .send({
        archived: true
      })
      .expect(200);

    const archivedProposal = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      }
    });

    expect(archivedProposal.archived).toBe(true);

    await request(baseUrl)
      .post(`/api/proposals/${proposal.id}/archive`)
      .set('Cookie', authorCookie)
      .send({
        archived: false
      })
      .expect(200);
    const unarchivedProposal = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      }
    });
    expect(unarchivedProposal.archived).toBe(false);
  });
  it('should not allow a user without permissions to archive the proposal, responding with 401', async () => {
    const spaceMemberCookie = await loginUser(spaceMember.id);

    await request(baseUrl)
      .post(`/api/proposals/${proposal.id}/archive`)
      .set('Cookie', spaceMemberCookie)
      .send({
        archived: true
      })
      .expect(401);
  });
});
