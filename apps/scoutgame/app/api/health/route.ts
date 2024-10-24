import { prisma } from '@charmverse/core/prisma-client';

export async function GET() {
  // test that the DB is configured properly
  await prisma.scout.findFirst();
  return new Response('ok');
}
