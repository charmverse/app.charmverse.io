import type { User } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';
import { Wallet } from 'ethers';

export const baseUrl = process.env.DOMAIN as string;

/**
 * Calls the login API and returns the user cookie
 * @param walletAddress
 */
export async function loginUser (walletAddress: string): Promise<string> {
  const cookie: string = (await request(baseUrl)
    .post('/api/session/login')
    .send({
      address: walletAddress
    })).headers['set-cookie'][0];

  return cookie;
}

export async function registerUser (walletAddress: string = Wallet.createRandom().address): Promise<string> {
  const cookie: string = (await request(baseUrl)
    .post('/api/profile')
    .send({
      address: walletAddress
    })).headers['set-cookie'][0];

  return cookie;
}
