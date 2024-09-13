/* eslint-disable no-case-declarations */
import { prisma } from '@charmverse/core/prisma-client';

const apiKey = process.env.CONNECTOR_KEY as string;

export async function GET(req: Request) {
  if (!apiKey) {
    return new Response('API Key not configured in env', {
      status: 401
    });
  }

  const apiKeyHeader = req.headers.get('Authorization');

  if (!apiKeyHeader || apiKeyHeader !== apiKey) {
    return new Response('Unauthorized', {
      status: 401
    });
  }

  const waitlistData = await prisma.connectWaitlistSlot.findMany({
    orderBy: {
      // Return scores lowest to highest
      score: 'asc'
    },
    select: {
      fid: true,
      username: true,
      score: true,
      createdAt: true,
      percentile: true,
      initialPosition: true,
      referredByFid: true,
      githubLogin: true
    }
  });

  return new Response(JSON.stringify(waitlistData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
