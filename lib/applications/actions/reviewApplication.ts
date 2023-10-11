import type { Application } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { InvalidInputError } from 'lib/utilities/errors';

import type { ReviewDecision } from '../interfaces';

export type ApplicationReviewDecision = {
  userId: string;
  applicationOrApplicationId: string | Application;
  decision: ReviewDecision;
};

export async function reviewApplication({
  applicationOrApplicationId,
  userId,
  decision
}: ApplicationReviewDecision): Promise<Application> {
  if (!decision) {
    throw new InvalidInputError(`Decision must be approve or reject`);
  }

  const application =
    typeof applicationOrApplicationId === 'string'
      ? await prisma.application.findUniqueOrThrow({
          where: {
            id: applicationOrApplicationId
          },
          select: {
            id: true
          }
        })
      : applicationOrApplicationId;

  const updated = (await prisma.application.update({
    where: {
      id: application.id
    },
    data: {
      status: decision === 'approve' ? 'inProgress' : 'rejected',
      acceptedBy: userId
    }
  })) as Application;

  return updated;
}
