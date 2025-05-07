import type { Space, User } from '@charmverse/core/prisma';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { createUserWithWallet, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { addUserGoogleAccount, generateUser } from '@packages/testing/utils/users';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';
import { searchUserProfile } from 'lib/public-api/searchUserProfile';
import { v4 } from 'uuid';

let user: User;
let user1Wallet: string;
let user2: User;
let user2Wallet: string;
let user3: User;
let user3Wallet: string;

let space: Space;

beforeAll(async () => {
  user1Wallet = randomETHWalletAddress();
  const generated = await generateUserAndSpace({ walletAddress: user1Wallet });
  user = generated.user;
  space = generated.space;
  await addUserGoogleAccount({ userId: user.id, email: 'user1@gmail.com' });

  user2Wallet = randomETHWalletAddress();
  user2 = await createUserWithWallet({ address: user2Wallet, email: 'user2@example.com' });
  await addUserToSpace({ spaceId: space.id, userId: user2.id, isAdmin: false });

  user3Wallet = randomETHWalletAddress();
  user3 = await createUserWithWallet({ address: user3Wallet, email: 'user3@example.com' });
  await addUserToSpace({ spaceId: space.id, userId: user3.id, isAdmin: false });
});

describe('searchUserProfile', () => {
  it('should find user by id', async () => {
    const res = await searchUserProfile({ userId: user.id });

    expect(res).toMatchObject(
      expect.objectContaining({
        id: user.id,
        username: user.username
      })
    );
  });

  it('should find user by wallet', async () => {
    const res = await searchUserProfile({ wallet: user2Wallet });

    expect(res).toMatchObject(
      expect.objectContaining({
        id: user2.id,
        wallet: user2Wallet,
        email: 'user2@example.com',
        avatar: '',
        username: user2.username
      })
    );
  });

  it('should find user by email', async () => {
    const res = await searchUserProfile({ email: 'user3@example.com' });

    expect(res).toMatchObject(
      expect.objectContaining({
        id: user3.id,
        wallet: user3Wallet,
        email: 'user3@example.com',
        avatar: '',
        username: user3.username
      })
    );
  });

  it('should find user by email associated with google account', async () => {
    const res = await searchUserProfile({ email: 'user1@gmail.com' });

    expect(res).toMatchObject(
      expect.objectContaining({
        id: user.id,
        wallet: user1Wallet,
        email: 'user1@gmail.com',
        avatar: '',
        username: user.username
      })
    );
  });

  it('should throw error if search params are not provided', async () => {
    await expect(searchUserProfile({})).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw error if user does not exist', async () => {
    await expect(searchUserProfile({ email: `${v4()}@gmail.com` })).rejects.toBeInstanceOf(DataNotFoundError);
    await expect(searchUserProfile({ wallet: randomETHWalletAddress() })).rejects.toBeInstanceOf(DataNotFoundError);
    await expect(searchUserProfile({ userId: v4() })).rejects.toBeInstanceOf(DataNotFoundError);
  });

  it('should throw error if user does not belong to the space', async () => {
    const generatedUser = await generateUser();
    await expect(searchUserProfile({ userId: generatedUser.id, spaceIds: [space.id] })).rejects.toBeInstanceOf(
      DataNotFoundError
    );
  });
});
