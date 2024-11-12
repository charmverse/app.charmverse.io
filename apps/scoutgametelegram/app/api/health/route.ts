import { prisma } from '@charmverse/core/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  // test that the DB is configured properly
  await prisma.scout.findFirst({
    select: {
      id: true
    }
  });
  return new Response('ok');
}
