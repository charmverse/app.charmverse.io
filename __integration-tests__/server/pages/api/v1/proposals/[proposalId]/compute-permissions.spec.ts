import type { Proposal, Space, SuperApiToken, User } from '@charmverse/core/prisma';
import type { SpaceApiToken } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateSpaceApiKey, generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';

import { permissionsApiClient } from 'lib/permissions/api/client';
import type { PublicProposalApiPermissions } from 'pages/api/v1/proposals/[proposalId]/compute-permissions';

let proposal: Proposal;

let proposalAuthor: User;
let spaceMember: User;

let space: Space;

let apiKey: SpaceApiToken;
let superApiKey: SuperApiToken;

beforeAll(async () => {
  ({ space, user: proposalAuthor } = await testUtilsUser.generateUserAndSpace());
  spaceMember = await testUtilsUser.generateSpaceUser({
    spaceId: space.id
  });

  apiKey = await generateSpaceApiKey({ spaceId: space.id });
  superApiKey = await generateSuperApiKey({ spaceId: space.id });

  proposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: proposalAuthor.id,
    proposalStatus: 'draft',
    authors: [proposalAuthor.id]
  });
});

describe('GET /api/v1/proposals/{proposalId}/compute-permissions', () => {
  it('should return computed proposal permissions when called with an API key', async () => {
    const authorResponse = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}/compute-permissions?userId=${proposalAuthor.id}`)
        .set({
          authorization: `Bearer ${apiKey.token}`
        })
        .expect(200)
    ).body as PublicProposalApiPermissions;

    const authorPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: proposalAuthor.id
    });

    expect(authorResponse).toMatchObject<PublicProposalApiPermissions>({
      proposalId: proposal.id,
      userId: proposalAuthor.id,
      permissions: authorPermissions
    });

    const memberResponse = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}/compute-permissions?userId=${spaceMember.id}`)
        .set({
          authorization: `Bearer ${apiKey.token}`
        })
        .expect(200)
    ).body as PublicProposalApiPermissions;

    const memberPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: spaceMember.id
    });

    expect(memberResponse).toMatchObject<PublicProposalApiPermissions>({
      proposalId: proposal.id,
      userId: spaceMember.id,
      permissions: memberPermissions
    });
  });

  it('should return computed proposal permissions when called with a super API key', async () => {
    const authorResponse = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}/compute-permissions?spaceId=${space.id}&userId=${proposalAuthor.id}`)
        .set({
          authorization: `Bearer ${superApiKey.token}`
        })
        .expect(200)
    ).body as PublicProposalApiPermissions;

    const authorPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: proposalAuthor.id
    });

    expect(authorResponse).toMatchObject<PublicProposalApiPermissions>({
      proposalId: proposal.id,
      userId: proposalAuthor.id,
      permissions: authorPermissions
    });

    const memberResponse = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}/compute-permissions?spaceId=${space.id}&userId=${spaceMember.id}`)
        .set({
          authorization: `Bearer ${superApiKey.token}`
        })
        .expect(200)
    ).body as PublicProposalApiPermissions;

    const memberPermissions = await permissionsApiClient.proposals.computeProposalPermissions({
      resourceId: proposal.id,
      userId: spaceMember.id
    });

    expect(memberResponse).toMatchObject<PublicProposalApiPermissions>({
      proposalId: proposal.id,
      userId: spaceMember.id,
      permissions: memberPermissions
    });
  });

  it('should fail if the requester api key is not linked to this space', async () => {
    const otherSpace = await testUtilsUser.generateUserAndSpace();
    const otherSpaceApiKey = await generateSpaceApiKey({
      spaceId: otherSpace.space.id
    });
    const otherSpaceSuperApiKey = await generateSuperApiKey({
      spaceId: otherSpace.space.id
    });

    // Space API key used, don't disclose resource exists
    await request(baseUrl)
      .get(`/api/v1/proposals/${proposal.id}/compute-permissions?userId=${proposalAuthor.id}`)
      .set({ authorization: `Bearer ${otherSpaceApiKey.token}` })
      .expect(404);
    // Space ID provided not included in authorized space IDs for super API key
    await request(baseUrl)
      .get(`/api/v1/proposals/${proposal.id}/compute-permissions?spaceId=${space.id}&userId=${proposalAuthor.id}`)
      .set({ authorization: `Bearer ${otherSpaceSuperApiKey.token}` })
      .expect(401);
  });
});
