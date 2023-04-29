import { prisma } from '@charmverse/core';

import type { BountyWithDetails } from 'lib/bounties';
import { includePagePermissions } from 'lib/pages/server';
import { InvalidInputError } from 'lib/utilities/errors';

import { getBountyOrThrow } from './getBounty';

export async function markBountyAsPaid(bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBountyOrThrow(bountyId);

  if (
    bounty.applications.some(
      (application) =>
        application.status !== 'paid' && application.status !== 'complete' && application.status !== 'rejected'
    )
  ) {
    throw new InvalidInputError('All applications need to be either completed or paid in order to mark bounty as paid');
  }

  const completedApplications = bounty.applications.filter((app) => app.status === 'complete');

  await prisma.application.updateMany({
    where: {
      id: {
        in: completedApplications.map((completedApplication) => completedApplication.id)
      }
    },
    data: {
      status: 'paid'
    }
  });

  return prisma.bounty.update({
    where: {
      id: bounty.id
    },
    data: {
      status: 'paid'
    },
    include: {
      applications: true,
      page: {
        include: includePagePermissions()
      }
    }
  }) as Promise<BountyWithDetails>;
}
