import type { Space, User } from '@charmverse/core/prisma';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';

import { addCharms } from 'lib/charms/addCharms';
import type { TransactionResult } from 'lib/charms/addTransaction';

let space: Space;
let user: User;
let userCookie: string;

beforeEach(async () => {
  const { user: generatedUser, space: generatedSpace } = await generateUserAndSpace(undefined);
  space = generatedSpace;
  user = generatedUser;
  userCookie = await loginUser(user.id);
});

describe('GET /api/profile/charms - Get user charms balance', () => {
  it('should return logged in user balance, responding with 200', async () => {
    await addCharms({ recipient: { userId: user.id }, amount: 100 });

    const response = (await request(baseUrl).get('/api/profile/charms').set('Cookie', userCookie).expect(200)).body as {
      balance: number;
    };

    expect(response.balance).toBe(100);
  });
});

describe('PUT /api/profile/charms - Transfers user charms', () => {
  it('should transfer charms to space, responding with 200', async () => {
    await addCharms({ recipient: { userId: user.id }, amount: 100 });

    const response = (
      await request(baseUrl)
        .put('/api/profile/charms')
        .set('Cookie', userCookie)
        .send({
          spaceId: space.id,
          amount: 60
        })
        .expect(200)
    ).body as TransactionResult;

    expect(response.balance).toBe(40);
  });

  it('should not transfer if recipient is not provided, responding with 400', async () => {
    await addCharms({ recipient: { userId: user.id }, amount: 100 });

    await request(baseUrl).put('/api/profile/charms').set('Cookie', userCookie).send({ amount: 30 }).expect(400);
  });

  it('should not if invalid amount is provided, responding with 400', async () => {
    await addCharms({ recipient: { userId: user.id }, amount: 100 });

    await request(baseUrl)
      .put('/api/profile/charms')
      .set('Cookie', userCookie)
      .send({ amount: 130, spaceId: space.id })
      .expect(400);

    await request(baseUrl)
      .put('/api/profile/charms')
      .set('Cookie', userCookie)
      .send({ amount: 0, spaceId: space.id })
      .expect(400);
  });
});
