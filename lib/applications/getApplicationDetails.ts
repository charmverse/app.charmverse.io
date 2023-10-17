import { prisma } from '@charmverse/core/prisma-client';

export function getApplicationDetails(applicationId: string) {
  return prisma.application.findUnique({
    where: {
      id: applicationId
    },
    include: {
      bounty: {
        include: {
          page: true
        }
      }
    }
  });
}
