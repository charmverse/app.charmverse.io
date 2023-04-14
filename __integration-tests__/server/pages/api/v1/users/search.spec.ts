import { prisma } from '@charmverse/core';
import type { Space, SuperApiToken, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import { createUserFromWallet } from 'lib/users/createUser';
import type { PublicApiProposal } from 'pages/api/v1/proposals';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { addUserToSpace } from 'testing/utils/spaces';
import { addUserGoogleAccount, addUserWallet } from 'testing/utils/users';

let user: User;
let user1Wallet: string;
let user2: User;
let user2Wallet: string;
let user3: User;
let user3Wallet: string;

let space: Space;
let superApiKey: SuperApiToken;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
  user1Wallet = randomETHWalletAddress();
  await addUserGoogleAccount({ userId: user.id, email: 'user1@gmail.com' });
  await addUserWallet({ userId: user.id, address: user1Wallet });

  user2Wallet = randomETHWalletAddress();
  user2 = await createUserFromWallet({ address: user2Wallet, email: 'user2@example.com' });
  await addUserToSpace({ spaceId: space.id, userId: user2.id, isAdmin: false });

  user3Wallet = randomETHWalletAddress();
  user3 = await createUserFromWallet({ address: user3Wallet, email: 'user3@example.com' });
  await addUserToSpace({ spaceId: space.id, userId: user3.id, isAdmin: false });

  superApiKey = await prisma.superApiToken.create({
    data: {
      token: v4(),
      name: `test-super-api-key-${v4()}`,
      spaces: { connect: { id: space.id } }
    }
  });
});

describe('GET /api/v1/users/search', () => {
  it('should search user by email address', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/users/search?email=${user2.email}`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send()
        .expect(200)
    ).body as PublicApiProposal[];

    expect(response).toMatchObject(
      expect.objectContaining({
        id: user2.id,
        wallet: user2Wallet,
        email: 'user2@example.com',
        avatar: '',
        username: user2.username
      })
    );
  });

  it('should search user by email address associated with google account', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/users/search?&email=user1@gmail.com`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send()
        .expect(200)
    ).body as PublicApiProposal[];

    expect(response).toMatchObject(
      expect.objectContaining({
        id: user.id,
        wallet: user1Wallet,
        email: 'user1@gmail.com',
        avatar: '',
        username: user.username
      })
    );
  });

  it('should search user by wallet address', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/users/search?&wallet=${user3Wallet}`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send()
        .expect(200)
    ).body as PublicApiProposal[];

    expect(response).toMatchObject(
      expect.objectContaining({
        id: user3.id,
        wallet: user3Wallet,
        email: 'user3@example.com',
        avatar: '',
        username: user3.username
      })
    );
  });

  it('should fail if user is not found or is not a part of the space', async () => {
    const randomEmail = 'random@example.com';
    await createUserFromWallet({ email: randomEmail });

    await request(baseUrl)
      .get(`/api/v1/users/search?&email=${randomEmail}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send()
      .expect(404);

    await request(baseUrl)
      .get(`/api/v1/users/search?&wallet=${randomETHWalletAddress()}`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send()
      .expect(404);

    await request(baseUrl)
      .get(`/api/v1/users/search`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send()
      .expect(400);
  });
});
