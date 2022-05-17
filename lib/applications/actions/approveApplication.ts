import { Application } from '@prisma/client';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { prisma } from 'db';
import { ApplicationActionRequest } from '../interfaces';
import { getApplication } from '../getApplication';

export async function approveApplication ({ applicationOrApplicationId, userId }: ApplicationActionRequest): Promise<Application> {
  const application = await getApplication(typeof applicationOrApplicationId === 'string' ? applicationOrApplicationId : applicationOrApplicationId.id);

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationOrApplicationId} was not found`);
  }

  // Only admins can approve the application (for now)
  const { error, isAdmin } = await hasAccessToSpace({ userId, spaceId: application.bounty.spaceId, adminOnly: true });

  if (error) {
    throw error;
  }

  if (isAdmin === false) {
    throw new UnauthorisedActionError('You do not have permissions to approve this application');
  }

  const updated = await prisma.application.update({
    where: {
      id: application.id
    },
    data: {
      status: 'inProgress'
    }
  }) as Application;

  return updated;
}
