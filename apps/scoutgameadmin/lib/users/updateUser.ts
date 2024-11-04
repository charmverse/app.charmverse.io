import type { BuilderStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export async function setBuilderStatus(userId: string, status: BuilderStatus) {
  return prisma.scout.update({ where: { id: userId }, data: { builderStatus: status } });
}
