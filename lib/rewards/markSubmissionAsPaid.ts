import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export async function markSubmissionAsPaid(submissionId: string): Promise<Application> {
  return prisma.application.update({
    where: {
      id: submissionId
    },
    data: {
      status: 'paid'
    }
  });
}
