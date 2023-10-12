import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { refreshPaymentStatus } from 'lib/applications/actions/refreshPaymentStatus';

export async function refreshUnpaidApplications(userId?: string) {
  const applications = await prisma.application.findMany({
    where: {
      status: { in: ['processing', 'complete'] },
      transactions: { some: {} }
    }
  });

  let updatedApplicationsCount = 0;

  for (const application of applications) {
    try {
      const { updated } = await refreshPaymentStatus({
        applicationId: application.id,
        userId
      });

      if (updated) {
        updatedApplicationsCount += 1;
      }
    } catch (e) {
      log.error('application-payment]', e);
    }
  }

  return { updatedApplicationsCount, totalCount: applications.length };
}
