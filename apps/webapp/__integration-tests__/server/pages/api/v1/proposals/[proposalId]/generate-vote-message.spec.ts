import type { AddressInfo } from 'node:net';

import type { Space, User } from '@charmverse/core/prisma';
import type { SpaceApiToken } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateSpaceApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createServer } from '__e2e__/utils/mockServer';
import request from 'supertest';
import { v4 } from 'uuid';
import { getAddress } from 'viem';

let proposalAuthor: User;
let space: Space;
let apiKey: SpaceApiToken;

const walletAddress = randomETHWalletAddress();

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    walletAddress
  });
  proposalAuthor = generated.user;
  space = generated.space;
  apiKey = await generateSpaceApiKey({ spaceId: space.id });
});

describe('POST /api/v1/proposals/{proposalId}/generate-vote-message', () => {
  it('should throw 401 error if no api key are passed with the request', async () => {
    const response = await request(baseUrl).post(`/api/v1/proposals/${v4()}/generate-vote-message`);
    expect(response.statusCode).toBe(401);
  });

  it('should throw 400 error if no payload is missing required fields', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/proposals/${v4()}/generate-vote-message`)
      .send({
        choice: 'Yes'
      })
      .set('Authorization', `Bearer ${apiKey.token}`);
    expect(response.statusCode).toBe(400);
  });

  it('should throw 404 error if no proposal with the provided id is found', async () => {
    const proposalId = v4();
    const response = await request(baseUrl)
      .post(`/api/v1/proposals/${proposalId}/generate-vote-message`)
      .send({
        choice: 'Yes',
        address: walletAddress
      })
      .set('Authorization', `Bearer ${apiKey.token}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(`Proposal with id ${proposalId} was not found.`);
  });

  it('should throw 400 error if proposal is not in vote_active status', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'draft',
      authors: [proposalAuthor.id]
    });
    const response = await request(baseUrl)
      .post(`/api/v1/proposals/${proposal.id}/generate-vote-message`)
      .send({
        choice: 'Yes',
        address: walletAddress
      })
      .set('Authorization', `Bearer ${apiKey.token}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(`Proposal with id ${proposal.id} is not in vote_active status.`);
  });

  it('should throw 404 error if proposal was not published to snapshot', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'published',
      authors: [proposalAuthor.id],
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [],
          id: v4()
        }
      ]
    });
    const response = await request(baseUrl)
      .post(`/api/v1/proposals/${proposal.id}/generate-vote-message`)
      .send({
        choice: 'Yes',
        address: walletAddress
      })
      .set('Authorization', `Bearer ${apiKey.token}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(`Proposal with id ${proposal.id} was not published to snapshot.`);
  });

  it('should throw 400 error if proposal space does not have any snapshot domain connected', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'published',
      authors: [proposalAuthor.id],
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [],
          id: v4(),
          snapshotId: v4()
        }
      ]
    });
    const response = await request(baseUrl)
      .post(`/api/v1/proposals/${proposal.id}/generate-vote-message`)
      .send({
        choice: 'Yes',
        address: walletAddress
      })
      .set('Authorization', `Bearer ${apiKey.token}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe(`No Snapshot domain connected to space yet.`);
  });

  it('should throw 404 error if proposal was not found on snapshot', async () => {
    const snapshotProposalId = v4();

    const generated = await generateUserAndSpace({
      snapshotDomain: 'test-hub'
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: generated.space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'published',
      authors: [proposalAuthor.id],
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [],
          id: v4(),
          snapshotId: snapshotProposalId
        }
      ]
    });

    const { listen, router } = createServer();

    router.post('/graphql', (ctx) => {
      ctx.body = {
        data: {
          proposals: []
        }
      };
    });

    const server = await listen(8500);

    try {
      const response = await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/generate-vote-message`)
        .query({ snapshotApiUrl: `http://localhost:${(server.address() as AddressInfo).port}` })
        .send({
          choice: 'Yes',
          address: walletAddress
        })
        .set('Authorization', `Bearer ${apiKey.token}`);
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe(`Proposal was not found on Snapshot.`);
    } finally {
      await new Promise((done) => {
        server.close(done);
      });
    }
  });

  it('should return vote message response with 200 status code', async () => {
    const generated = await generateUserAndSpace({
      snapshotDomain: 'test-hub'
    });

    const snapshotProposalId = v4();
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: generated.space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'published',
      authors: [proposalAuthor.id],
      evaluationInputs: [
        {
          evaluationType: 'vote',
          reviewers: [],
          permissions: [],
          id: v4(),
          snapshotId: snapshotProposalId
        }
      ]
    });

    const { listen, router } = createServer();

    router.post('/graphql', (ctx) => {
      ctx.body = {
        data: {
          proposals: [
            {
              scores_total: '0',
              scores: [],
              votes: [],
              state: 'active',
              end: 0,
              start: 0,
              choices: ['Yes', 'No'],
              body: '',
              title: '',
              id: snapshotProposalId,
              author: '',
              snapshot: '',
              space: {
                id: '',
                name: 'test-hub'
              },
              type: 'single-choice'
            }
          ]
        }
      };
    });

    const server = await listen(8500);
    try {
      const response = await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/generate-vote-message`)
        .query({ snapshotApiUrl: `http://localhost:${(server.address() as AddressInfo).port}` })
        .send({
          choice: 'Yes',
          address: walletAddress
        })
        .set('Authorization', `Bearer ${apiKey.token}`)
        .expect(200);

      expect(response.body.message).toMatchObject(
        expect.objectContaining({
          space: generated.space.snapshotDomain,
          proposal: snapshotProposalId,
          choice: 'Yes',
          reason: '',
          app: 'my-app',
          metadata: '{}',
          from: getAddress(walletAddress)
        })
      );
    } finally {
      await new Promise((done) => {
        server.close(done);
      });
    }
  });
});
