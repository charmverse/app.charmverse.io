import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getUserFromSession } from '@packages/scoutgame/session/getUserFromSession';
import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

export async function GET(request: Request) {
  const user = await getUserFromSession();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  if (!address) {
    return new Response('address is required', { status: 400 });
  }
  if (!isAddress(address)) {
    return new Response('Invalid address', { status: 400 });
  }
  const existingUser = await prisma.scoutWallet.findUnique({
    where: {
      address: address.toLowerCase()
    }
  });
  if (existingUser) {
    if (existingUser.scoutId !== user.id) {
      log.warn('Wallet address already in use by another user', {
        address,
        userId: user.id,
        existingUserId: existingUser.scoutId
      });
      return new Response(`Address ${address} is already in use`, {
        status: 400
      });
    }
  } else {
    await prisma.scoutWallet.create({
      data: {
        address: address.toLowerCase(),
        scoutId: user.id
      }
    });
    log.info('Added wallet address to user', { address, userId: user.id });
  }
  return NextResponse.json({ success: true });
}
