import { User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

export const baseUrl = process.env.DOMAIN as string;

/**
 * Calls the login API and returns the user cookie
 * @param walletAddress
 */
export async function loginUser (user: User): Promise<string> {
  const cookie: string = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: user.addresses[0]
    })).headers['set-cookie'][0];

  return cookie;
}

export async function registerUser (walletAddress: string = v4()): Promise<string> {
  const cookie: string = (await request(baseUrl)
    .post('/api/profile')
    .send({
      address: walletAddress
    })).headers['set-cookie'][0];

  return cookie;
}
