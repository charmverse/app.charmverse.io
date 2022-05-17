import { Application, Bounty } from '@prisma/client';
import { prisma } from 'db';
import { ApplicationWithBounty } from './interfaces';

export function getApplication (applicationId: string): Promise<ApplicationWithBounty | null> {
  return prisma.application.findUnique({
    where: {
      id: applicationId
    },
    include: {
      bounty: true
    }
  });
}
