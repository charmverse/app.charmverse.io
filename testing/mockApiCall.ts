import type { User } from '@prisma/client';
import request from 'supertest';
import type { TestLoginRequest } from 'pages/api/session/login-testenv';

export const baseUrl = process.env.DOMAIN as string;

/**
 * Calls the login API and returns the user cookie
 * @param walletAddress
 */
export async function loginUser (user: User): Promise<string> {

  const loginPayload: TestLoginRequest = {
    userId: user.id
  };

  const cookie: string = (await request(baseUrl)
    .post('/api/session/login-testenv')
    .send(loginPayload)).headers['set-cookie'][0];

  return cookie;
}

