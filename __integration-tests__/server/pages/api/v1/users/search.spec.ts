import type { Space, SuperApiToken, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { baseUrl } from '@packages/testing/mockApiCall';
import { createUserWithWallet, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { addUserToSpace } from '@packages/testing/utils/spaces';
import { addUserGoogleAccount, addUserWallet } from '@packages/testing/utils/users';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { PublicApiProposal } from 'pages/api/v1/proposals';

describe('GET /api/v1/users/search', () => {
  let user: User;
  let user1Wallet: string;
  let user2: User;
  let user2Wallet: string;
  let user3: User;
  let user3Wallet: string;

  let space: Space;
  let superApiKey: SuperApiToken;

  const email1 = `user1-${uuid()}@example.com`;
  const email2 = `user2-${uuid()}@example.com`;
  const email3 = `user3-${uuid()}@example.com`;

  beforeAll(async () => {
    const generated = await generateUserAndSpace();
    user = generated.user;
    space = generated.space;
    user1Wallet = randomETHWalletAddress();
    await addUserGoogleAccount({ userId: user.id, email: email1 });
    await addUserWallet({ userId: user.id, address: user1Wallet });

    user2Wallet = randomETHWalletAddress();
    user2 = await createUserWithWallet({ address: user2Wallet, email: email2 });
    await addUserToSpace({ spaceId: space.id, userId: user2.id, isAdmin: false });

    user3Wallet = randomETHWalletAddress();
    user3 = await createUserWithWallet({ address: user3Wallet, email: email3 });
    await addUserToSpace({ spaceId: space.id, userId: user3.id, isAdmin: false });

    superApiKey = await prisma.superApiToken.create({
      data: {
        token: uuid(),
        name: `test-super-api-key-${uuid()}`,
        spaces: { connect: { id: space.id } }
      }
    });
  });
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
        email: email2,
        avatar: '',
        username: user2.username
      })
    );
  });

  it('should search user by email address associated with google account', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/users/search?&email=${email1}`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send()
        .expect(200)
    ).body as PublicApiProposal[];

    expect(response).toMatchObject(
      expect.objectContaining({
        id: user.id,
        wallet: user1Wallet,
        email: email1,
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
        email: email3,
        avatar: '',
        username: user3.username
      })
    );
  });

  it('should search user by userId', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/users/search?&userId=${user3.id}`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send()
        .expect(200)
    ).body as PublicApiProposal[];

    expect(response).toMatchObject(
      expect.objectContaining({
        id: user3.id,
        wallet: user3Wallet,
        email: email3,
        avatar: '',
        username: user3.username
      })
    );
  });

  it('should fail if user is not found or is not a part of the space', async () => {
    const randomEmail = 'random@example.com';
    await createUserWithWallet({ email: randomEmail, address: randomETHWalletAddress() });

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
