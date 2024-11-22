import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextRequest } from 'next/server';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const strikeId = searchParams.get('strikeId');
  if (!strikeId) {
    return Response.json({ error: 'Strike ID is required' }, { status: 400 });
  }
  // Delete the strike
  const strike = await prisma.builderStrike.update({
    where: {
      id: strikeId
    },
    data: {
      deletedAt: new Date()
    }
  });

  log.info('Builder strike marked as deleted', { builderId: strike.builderId, strikeId });

  return Response.json({ success: true });
}
