import { prisma } from '@charmverse/core/prisma-client';
import { sessionUserRelations } from '@packages/profile/constants';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { shortWalletAddress } from '@packages/utils/blockchain';
import { InvalidInputError, MissingDataError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { v4 } from 'uuid';

import { refreshENSName } from '../refreshENSName';

jest.mock('@packages/blockchain/getENSName', () => {
  return {
    getENSName: (address: string) => {
      if (address.match('different')) {
        return null;
      }
      return `testname-${address}.eth`;
    }
  };
});
afterAll(async () => {
  jest.resetModules();
});

function checkEnsName(address: string, ensName: string) {
  return ensName === `testname-${address}.eth`;
}

describe('refreshENSName', () => {
  it('should retrieve the ENS Name and assign it to the user wallet', async () => {
    const address = randomETHWalletAddress();
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: address,
        wallets: {
          create: {
            address,
            // We want to ensure this old value is overwritten
            ensname: `testname-${v4()}.eth`
          }
        }
      }
    });

    const userAfterRefresh = await refreshENSName({
      userId: user.id,
      address
    });

    expect(checkEnsName(address, userAfterRefresh.wallets[0].ensname as string)).toBe(true);
  });

  it('should update the current users used displayname to the ENS name if identity type is "Wallet" and current address matches the ENS Name', async () => {
    const address = randomETHWalletAddress();
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: address,
        wallets: {
          create: {
            address
          }
        }
      }
    });

    const userAfterRefresh = await refreshENSName({
      userId: user.id,
      address
    });

    expect(checkEnsName(address, userAfterRefresh.username)).toBe(true);
  });
  it('should  not support the shortened address as a lookup for the users ENS Name', async () => {
    const address = randomETHWalletAddress();
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: address,
        wallets: {
          create: {
            address
          }
        }
      }
    });

    await expect(
      refreshENSName({
        userId: user.id,
        address: shortWalletAddress(address)
      })
    ).rejects.toBeInstanceOf(MissingDataError);
  });

  it('should update the ENS name if different', async () => {
    const address = `different-${randomETHWalletAddress()}`;
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: address,
        wallets: {
          create: {
            address,
            ensname: `testname-${v4()}.eth`
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterRefresh = await refreshENSName({
      userId: user.id,
      address
    });

    expect(userAfterRefresh.wallets[0].ensname).not.toBe(user.wallets[0].ensname);
  });

  it('should throw an error if userID or wallet address is not provided', async () => {
    await expect(refreshENSName({ userId: '123', address: null as any })).rejects.toBeInstanceOf(InvalidInputError);

    await expect(refreshENSName({ userId: null as any, address: randomETHWalletAddress() })).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });

  it('should throw an error if the user does not exist', async () => {
    await expect(refreshENSName({ userId: v4(), address: randomETHWalletAddress() })).rejects.toBeInstanceOf(
      MissingDataError
    );
  });
  it('should throw an error if this user does not have a matching wallet address or ENSname', async () => {
    const address = `${randomETHWalletAddress()}`;
    const user = await prisma.user.create({
      data: {
        path: uid(),
        username: 'Example User',
        identityType: 'Wallet'
      }
    });

    await expect(refreshENSName({ userId: user.id, address })).rejects.toBeInstanceOf(MissingDataError);
    await expect(refreshENSName({ userId: user.id, address: randomETHWalletAddress() })).rejects.toBeInstanceOf(
      MissingDataError
    );
  });
});
