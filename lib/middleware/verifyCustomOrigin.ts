import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

export async function verifyCustomOrigin(origin: string | undefined) {
  if (!origin) {
    return false;
  }

  try {
    const space = await prisma.space.findFirst({
      where: {
        customDomain: { endsWith: origin }
      }
    });

    return !!space;
  } catch (error) {
    log.error('Error veryfing custom cors origin', { error });

    return false;
  }
}
