import { log } from '@charmverse/core/log';
import type { IdentityType } from '@charmverse/core/prisma-client';
import request from 'supertest';

import type { TestLoginRequest } from 'pages/api/session/login-testenv';

export const baseUrl = process.env.DOMAIN as string;

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

export async function loginAnonymousUser(anonymousUserId: string): Promise<string> {
  const loginPayload: TestLoginRequest = {
    anonymousUserId
  };

  const response = await request(baseUrl).post('/api/session/login-testenv').send(loginPayload);
  const cookie = response.headers['set-cookie']?.[0];
  if (!cookie) {
    log.error('Invalid response from login API', { headers: response.headers, status: response.status });
    throw new Error('No cookie set when logging in through test API');
  }

  return cookie;
}

export async function loginOtpUser(otpUser: { id: string; method: IdentityType }): Promise<string> {
  const loginPayload: TestLoginRequest = { otpUser };

  const response = await request(baseUrl).post('/api/session/login-testenv').send(loginPayload);
  const cookie = response.headers['set-cookie']?.[0];
  if (!cookie) {
    log.error('Invalid response from login API', { headers: response.headers, status: response.status });
    throw new Error('No cookie set when logging in through test API');
  }

  return cookie;
}
