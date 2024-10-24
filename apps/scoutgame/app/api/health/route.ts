import { prisma } from '@charmverse/core/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  // test that the DB is configured properly
  await prisma.scout.findFirst();
  return new Response('ok');
}
