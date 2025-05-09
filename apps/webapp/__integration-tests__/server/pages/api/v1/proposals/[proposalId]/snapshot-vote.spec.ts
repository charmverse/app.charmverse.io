import type { AddressInfo } from 'node:net';

import type { Space, User } from '@charmverse/core/prisma';
import type { Proposal, SpaceApiToken } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateSpaceApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createServer } from '__e2e__/utils/mockServer';
import request from 'supertest';
import { v4 } from 'uuid';

import { getCurrentDate } from '@packages/lib/utils/dates';

let proposalAuthor: User;
let space: Space;
let apiKey: SpaceApiToken;
let proposal: Proposal;

const walletAddress = randomETHWalletAddress();

const snapshotProposalId = v4();

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    walletAddress,
    snapshotDomain: 'test-hub'
  });
  proposalAuthor = generated.user;
  space = generated.space;
  apiKey = await generateSpaceApiKey({ spaceId: space.id });
  proposal = await testUtilsProposals.generateProposal({
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
});

const payload = {
  sig: '0x',
  data: 'data',
  address: walletAddress
};

const mockSnapshotProposal = {
  scores_total: '0',
  scores: [],
  votes: [],
  state: 'closed',
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
};

describe('POST /api/v1/proposals/{proposalId}/snapshot-vote', () => {
  it('should throw 401 error if no api key are passed with the request', async () => {
    const response = await request(baseUrl).post(`/api/v1/proposals/${v4()}/snapshot-vote`);
    expect(response.statusCode).toBe(401);
  });

  it('should throw 400 error if no payload is missing required fields', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/proposals/${v4()}/snapshot-vote`)
      .set('Authorization', `Bearer ${apiKey.token}`);
    expect(response.statusCode).toBe(400);
  });

  it('should throw 404 error if no proposal with the provided id is found', async () => {
    const proposalId = v4();
    const response = await request(baseUrl)
      .post(`/api/v1/proposals/${proposalId}/snapshot-vote`)
      .send(payload)
      .set('Authorization', `Bearer ${apiKey.token}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(`Proposal with id ${proposalId} was not found.`);
  });

  it('should throw 404 error if proposal was not found on snapshot', async () => {
    const { listen, router } = createServer();

    router.post('/graphql', (ctx) => {
      ctx.body = {
        data: {
          proposals: []
        }
      };
    });

    const server = await listen(8501);

    try {
      const response = await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/snapshot-vote`)
        .query({ snapshotApiUrl: `http://localhost:${(server.address() as AddressInfo).port}` })
        .send(payload)
        .set('Authorization', `Bearer ${apiKey.token}`);
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe(`Proposal was not found on Snapshot.`);
    } finally {
      await new Promise((done) => {
        server.close(done);
      });
    }
  });

  it('should throw 400 error if proposal is not active in snapshot', async () => {
    const { listen, router } = createServer();

    router.post('/graphql', (ctx) => {
      ctx.body = {
        data: {
          proposals: [mockSnapshotProposal]
        }
      };
    });

    const server = await listen(8502);

    try {
      const response = await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/snapshot-vote`)
        .query({ snapshotApiUrl: `http://localhost:${(server.address() as AddressInfo).port}` })
        .send(payload)
        .set('Authorization', `Bearer ${apiKey.token}`);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(`Voting for proposal with id: ${proposal.id} is not active.`);
    } finally {
      await new Promise((done) => {
        server.close(done);
      });
    }
  });

  it('should throw 400 error if proposal deadline has passed', async () => {
    const { listen, router } = createServer();

    router.post('/graphql', (ctx) => {
      ctx.body = {
        data: {
          proposals: [
            {
              ...mockSnapshotProposal,
              state: 'active'
            }
          ]
        }
      };
    });

    const server = await listen(8503);

    try {
      const response = await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/snapshot-vote`)
        .query({ snapshotApiUrl: `http://localhost:${(server.address() as AddressInfo).port}` })
        .send(payload)
        .set('Authorization', `Bearer ${apiKey.token}`);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(`Voting for proposal with id: ${proposal.id} has passed the deadline.`);
    } finally {
      await new Promise((done) => {
        server.close(done);
      });
    }
  });

  it('should return vote message response with 200 status code', async () => {
    const { listen, router } = createServer();
    const currentDate = getCurrentDate();
    router.post('/graphql', (ctx) => {
      ctx.body = {
        data: {
          proposals: [
            {
              ...mockSnapshotProposal,
              end: currentDate.setFullYear(currentDate.getFullYear() + 1),
              state: 'active'
            }
          ]
        }
      };
    });

    router.post('/', (ctx) => {
      ctx.body = {
        data: {}
      };
    });

    const server = await listen(8504);

    try {
      const response = await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/snapshot-vote`)
        .query({
          seqSnapshotUrl: `http://localhost:${(server.address() as AddressInfo).port}`,
          snapshotApiUrl: `http://localhost:${(server.address() as AddressInfo).port}`
        })
        .send(payload)
        .set('Authorization', `Bearer ${apiKey.token}`);
      expect(response.statusCode).toBe(200);
    } finally {
      await new Promise((done) => {
        server.close(done);
      });
    }
  });
});
