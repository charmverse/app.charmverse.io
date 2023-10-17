import { prisma } from '@charmverse/core/prisma-client';

export async function getSpaceById(id: string) {
  return prisma.space.findUniqueOrThrow({
    where: { id }
  });
}
