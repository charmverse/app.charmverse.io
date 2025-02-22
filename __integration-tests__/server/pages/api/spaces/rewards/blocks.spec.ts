import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { mockRewardBlocks } from '@packages/testing/mocks/rewards';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';

let space: Space;
let rewardBlocks: ReturnType<typeof mockRewardBlocks>;

beforeAll(async () => {
  const { space: generatedSpace, user } = await generateUserAndSpace();

  space = generatedSpace;
  rewardBlocks = mockRewardBlocks({ spaceId: space.id, createdBy: user.id });

  await prisma.rewardBlock.createMany({
    data: rewardBlocks
  });
});

describe('GET /api/spaces/[id]/rewards/blocks', () => {
  it('should return reward blocks for the space', async () => {
    const result = (await request(baseUrl).get(`/api/spaces/${space.id}/rewards/blocks`).expect(200)).body;

    expect(result).toEqual(
      expect.arrayContaining(rewardBlocks.map(({ id, type }) => expect.objectContaining({ id, type })))
    );
  });

  it('should return only "board" type block for the space', async () => {
    const result = (
      await request(baseUrl).get(`/api/spaces/${space.id}/rewards/blocks`).query({ type: 'board' }).expect(200)
    ).body;

    expect(result).toMatchObject([expect.objectContaining({ type: 'board' })]);
  });
});
