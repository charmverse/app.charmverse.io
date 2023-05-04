import type { Space, User } from '@charmverse/core/dist/prisma';

import { searchUserProfile } from 'lib/public-api/searchUserProfile';
import { createUserFromWallet } from 'lib/users/createUser';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { addUserGoogleAccount } from 'testing/utils/users';

let user: User;
let user1Wallet: string;
let user2: User;
let user2Wallet: string;
let user3: User;
let user3Wallet: string;

let space: Space;

beforeAll(async () => {
  user1Wallet = randomETHWalletAddress();
  const generated = await generateUserAndSpaceWithApiToken({ walletAddress: user1Wallet });
  user = generated.user;
  space = generated.space;
  await addUserGoogleAccount({ userId: user.id, email: 'user1@gmail.com' });

  user2Wallet = randomETHWalletAddress();
  user2 = await createUserFromWallet({ address: user2Wallet, email: 'user2@example.com' });
  await addUserToSpace({ spaceId: space.id, userId: user2.id, isAdmin: false });

  user3Wallet = randomETHWalletAddress();
  user3 = await createUserFromWallet({ address: user3Wallet, email: 'user3@example.com' });
  await addUserToSpace({ spaceId: space.id, userId: user3.id, isAdmin: false });
});

describe('searchUserProfile', () => {
  it('should find user by wallet', async () => {
    const res = await searchUserProfile({ spaceIds: [space.id], wallet: user2Wallet });

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
    const res = await searchUserProfile({ spaceIds: [space.id], email: 'user3@example.com' });

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
    const res = await searchUserProfile({ spaceIds: [space.id], email: 'user1@gmail.com' });

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
    await expect(searchUserProfile({ spaceIds: [space.id] })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw error if user does not exist', async () => {
    await expect(searchUserProfile({ spaceIds: [space.id], email: 'user123@gmail.com' })).rejects.toBeInstanceOf(
      DataNotFoundError
    );
  });

  it('should throw error if user is not a member of searched space', async () => {
    const randomEmail = 'random@example.com';
    await createUserFromWallet({ email: randomEmail });

    await expect(searchUserProfile({ spaceIds: [space.id], email: randomEmail })).rejects.toBeInstanceOf(
      DataNotFoundError
    );
  });
});
