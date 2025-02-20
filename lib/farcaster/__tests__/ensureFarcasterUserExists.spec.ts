import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { uid } from '@packages/utils/strings';
import { shortWalletAddress } from '@root/lib/utils/blockchain';
import { randomIntFromInterval } from '@root/lib/utils/random';

import { isProfilePathAvailable } from 'lib/profile/isProfilePathAvailable';

import type { TypedFarcasterUser } from '../ensureFarcasterUserExists';
import { ensureFarcasterUserExists } from '../ensureFarcasterUserExists';
import { getFarcasterUsers } from '../getFarcasterUsers';

jest.mock('../getFarcasterUsers');
jest.mock('@packages/utils/strings');
jest.mock('lib/utils/blockchain');
jest.mock('lib/profile/isProfilePathAvailable');

describe('ensureFarcasterUserExists', () => {
  it('should return existing Farcaster user if already in the database', async () => {
    const user = await testUtilsUser.generateUser();

    const fid = randomIntFromInterval(1, 100000);

    const existingFarcasterUser = await prisma.farcasterUser.create({
      data: {
        fid,
        user: {
          connect: {
            id: user.id
          }
        },
        account: {
          username: 'testuser',
          displayName: 'Test User',
          bio: 'Bio of test user',
          pfpUrl: 'testpfp.url'
        }
      }
    });

    const result = await ensureFarcasterUserExists({ fid });
    expect(result).toMatchObject(existingFarcasterUser);
  });

  it('should create a Farcaster user and link it to an existing user account', async () => {
    const fid = randomIntFromInterval(1, 100000);
    const existingUser = await prisma.user.create({
      data: {
        username: 'existinguser',
        identityType: 'Farcaster',
        path: 'existinguser-path',
        claimed: true,
        wallets: {
          create: [{ address: '0xexistingwallet' }]
        }
      }
    });

    (getFarcasterUsers as jest.Mock).mockResolvedValue([
      {
        fid,
        username: 'farcasteruser',
        custody_address: '0xexistingwallet',
        display_name: 'farcaster user name',
        profile: { bio: { text: 'Bio of farcaster user' } },
        pfp_url: 'farcaster.pfp.url'
      }
    ]);

    const result = await ensureFarcasterUserExists({ fid });
    expect(result).toMatchObject(
      expect.objectContaining<TypedFarcasterUser>({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        fid,
        userId: existingUser.id,
        account: {
          username: 'farcasteruser',
          displayName: 'farcaster user name',
          bio: 'Bio of farcaster user',
          pfpUrl: 'farcaster.pfp.url'
        }
      })
    );
  });

  it('should create a new Farcaster user and a new user account if no existing user account found', async () => {
    const fid = randomIntFromInterval(1, 100000);
    (getFarcasterUsers as jest.Mock).mockResolvedValue([
      {
        fid,
        username: 'newfarcasteruser',
        custody_address: '0xnewwallet',
        display_name: 'new farcaster user',
        profile: { bio: { text: 'Bio of new farcaster user' } },
        pfp_url: 'newfarcaster.pfp.url'
      }
    ]);

    (shortWalletAddress as jest.Mock).mockReturnValue('0xnewwalle-...');
    (isProfilePathAvailable as jest.Mock).mockResolvedValue(true);
    (uid as jest.Mock).mockReturnValue('new-uid');

    const result = await ensureFarcasterUserExists({ fid });
    expect(result).toMatchObject(
      expect.objectContaining<TypedFarcasterUser>({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        fid,
        userId: expect.any(String),
        account: {
          displayName: 'new farcaster user',
          bio: 'Bio of new farcaster user',
          pfpUrl: 'newfarcaster.pfp.url',
          username: 'newfarcasteruser'
        }
      })
    );
  });

  it('should throw DataNotFoundError if the Farcaster user is not found in the external service', async () => {
    const fid = randomIntFromInterval(1, 100000);
    (getFarcasterUsers as jest.Mock).mockResolvedValue([]);

    await expect(ensureFarcasterUserExists({ fid })).rejects.toThrow(DataNotFoundError);
  });

  it('should throw an error for invalid fid input', async () => {
    await expect(ensureFarcasterUserExists({ fid: null as unknown as number })).rejects.toThrow();
  });
});
