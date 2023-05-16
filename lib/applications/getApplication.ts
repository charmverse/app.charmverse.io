import { prisma } from '@charmverse/core';

import type { ApplicationWithBounty } from './interfaces';

export function getApplication(applicationId: string): Promise<ApplicationWithBounty | null> {
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
