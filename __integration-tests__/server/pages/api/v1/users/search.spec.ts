import type { Space, SpaceApiToken, User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import { prisma } from 'db';
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
let normalApiToken: SpaceApiToken;

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

  normalApiToken = await prisma.spaceApiToken.create({
    data: {
      token: v4(),
      space: { connect: { id: space.id } }
    }
  });
});

describe('GET /api/v1/users/search', () => {
  it('should search user by email address', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/users/search?api_key=${normalApiToken.token}&email=${user2.email}`)
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
        .get(`/api/v1/users/search?api_key=${normalApiToken.token}&email=user1@gmail.com`)
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
        .get(`/api/v1/users/search?api_key=${normalApiToken.token}&wallet=${user3Wallet}`)
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
      .get(`/api/v1/users/search?api_key=${normalApiToken.token}&email=${randomEmail}`)
      .send()
      .expect(404);

    await request(baseUrl)
      .get(`/api/v1/users/search?api_key=${normalApiToken.token}&wallet=${randomETHWalletAddress()}`)
      .send()
      .expect(404);

    await request(baseUrl).get(`/api/v1/users/search?api_key=${normalApiToken.token}`).send().expect(400);
  });
});
