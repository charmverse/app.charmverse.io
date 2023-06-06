import { prisma } from '@charmverse/core/prisma-client';

import type { BountyWithDetails } from 'lib/bounties';
import { includePagePermissionsWithSource } from 'lib/permissions/pages/includePagePermissionsWithSource';
import { InvalidInputError } from 'lib/utilities/errors';

import { paidBountyStatuses } from './constants';
import { getBountyOrThrow } from './getBounty';

export async function markBountyAsPaid(bountyId: string): Promise<BountyWithDetails> {
  const bounty = await getBountyOrThrow(bountyId);

  if (!bounty.applications.every((application) => paidBountyStatuses.includes(application.status))) {
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
        include: includePagePermissionsWithSource()
      }
    }
  }) as Promise<BountyWithDetails>;
}
