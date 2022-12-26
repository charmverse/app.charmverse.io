import { Wallet } from 'ethers';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import { InvalidInputError, MissingDataError } from 'lib/utilities/errors';

import { refreshENSName } from '../refreshENSName';

jest.mock('../getENSName', () => {
  return {
    getENSName: (address: string) => {
      if (address.match('ignore')) {
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
    const address = Wallet.createRandom().address.toLowerCase();
    const user = await prisma.user.create({
      data: {
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

    expect(checkEnsName(address, userAfterRefresh.wallets[0].ensname as string)).toBe(true);
  });

  it('should perform a no-op if no ENS name is found', async () => {
    const address = `ignore-${Wallet.createRandom().address.toLowerCase()}`;
    const user = await prisma.user.create({
      data: {
        username: address,
        wallets: {
          create: {
            address
          }
        }
      },
      include: sessionUserRelations
    });

    const userAfterRefresh = await refreshENSName({
      userId: user.id,
      address
    });

    expect(userAfterRefresh.wallets[0].ensname).toBeNull();
  });

  it('should throw an error if userID or wallet address is not provided', async () => {
    await expect(refreshENSName({ userId: '123', address: null as any })).rejects.toBeInstanceOf(InvalidInputError);

    await expect(refreshENSName({ userId: null as any, address: v4() })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if the user does not exist', async () => {
    await expect(refreshENSName({ userId: v4(), address: v4() })).rejects.toBeInstanceOf(MissingDataError);
  });
  it('should throw an error if this user does not have a matching wallet address', async () => {
    const address = `${Wallet.createRandom().address}`;
    const user = await prisma.user.create({
      data: {
        username: 'Example User',
        identityType: 'RandomName'
      }
    });

    await expect(refreshENSName({ userId: user.id, address })).rejects.toBeInstanceOf(MissingDataError);
  });
});
