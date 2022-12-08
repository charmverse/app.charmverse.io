import request from 'supertest';

import log from 'lib/log';
import type { TestLoginRequest } from 'pages/api/session/login-testenv';

export const baseUrl = process.env.DOMAIN as string;

/**
 * Calls the login API and returns the user cookie
 * @param walletAddress
 */
export async function loginUser(userId: string): Promise<string> {
  const loginPayload: TestLoginRequest = {
    userId
  };

  const response = await request(baseUrl).post('/api/session/login-testenv').send(loginPayload);
  const cookie = response.headers['set-cookie']?.[0];
  if (!cookie) {
    log.error('Invalid response from login API', { headers: response.headers, status: response.status });
    throw new Error('No cookie set when logging in through test API');
  }

  return cookie;
}
