import { Space, User } from '@prisma/client';
import { prisma } from 'db';
import nock from 'nock';
import { DataNotFoundError } from 'lib/utilities/errors';
import fetch from 'node-fetch';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { DEEP_DAO_BASE_URL } from 'lib/deepdao/client';

let user: User;
let space: Space;

const walletAddresses = [v4(), v4()];

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(walletAddresses[0], false);
  user = generated.user;
  space = generated.space;

  await prisma.user.update({
    where: {
      id: user.id
    },
    // Update wallet address so we can get cumulative results
    data: {
      addresses: walletAddresses
    }
  });
});

afterEach(() => {
  nock.restore();
});

describe('GET /api/public/profile/[userPath]', () => {

  it('should throw a not found error if userPath doesn\'t return any user', async () => {
    const { getAggregatedData } = await import('../getAggregatedData');
    try {
      await getAggregatedData(v4(), 'dummy_key');
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('Should combine several responses', async () => {
    const { getAggregatedData } = await import('../getAggregatedData');

    await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'complete',
      spaceId: space.id,
      userId: user.id
    });

    nock(DEEP_DAO_BASE_URL)
      .get(`/people/participation_score/${walletAddresses[0]}`)
      .reply(200, {
        daos: 4,
        proposals: 12,
        votes: 9
      })
      .get(`/people/participation_score/${walletAddresses[1]}`)
      .reply(200, {
        daos: 6,
        proposals: 8,
        votes: 6
      });

    const aggregatedData = await getAggregatedData(user.id, 'dummy_key');

    expect(aggregatedData).toStrictEqual({
      daos: 11,
      proposals: 20,
      votes: 15,
      bounties: 1
    });
  });
});
