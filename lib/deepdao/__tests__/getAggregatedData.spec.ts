import { Space, User } from '@prisma/client';
import { prisma } from 'db';
import nock from 'nock';
import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateBountyWithSingleApplication, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { DEEP_DAO_BASE_URL } from 'lib/deepdao/interfaces';
import { getAggregatedData } from 'lib/deepdao/getAggregatedData';

nock.disableNetConnect();
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

afterAll(() => {
  nock.restore();
});

describe('GET /api/public/profile/[userPath]', () => {

  it('should throw a not found error if userPath doesn\'t return any user', async () => {
    try {
      await getAggregatedData(v4(), 'dummy_key');
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('Should combine several responses', async () => {

    await generateBountyWithSingleApplication({
      bountyCap: 1,
      applicationStatus: 'complete',
      spaceId: space.id,
      userId: user.id
    });

    const scope = nock(DEEP_DAO_BASE_URL as string)
      .get(`/v0.1/people/participation_score/${walletAddresses[0]}`)
      .reply(200, {
        data: {
          daos: 4,
          proposals: 12,
          votes: 9
        }
      })
      .get(`/v0.1/people/participation_score/${walletAddresses[1]}`)
      .reply(200, {
        data: {
          daos: 6,
          proposals: 8,
          votes: 6
        }
      });

    // scope.on('request', (req, interceptor) => {
    //   console.log('interceptor matched request', interceptor.uri);
    // });
    // scope.on('replied', (req, interceptor) => {
    //   console.log('response replied with nocked payload', interceptor.uri);
    // });

    const aggregatedData = await getAggregatedData(user.id, 'dummy_key');

    expect(scope.isDone());

    expect(aggregatedData).toStrictEqual({
      daos: 11,
      proposals: 20,
      votes: 15,
      bounties: 1
    });
  });
});
