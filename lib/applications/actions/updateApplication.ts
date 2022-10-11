import type { Application } from '@prisma/client';

import { prisma } from 'db';
import { DataNotFoundError, StringTooShortError } from 'lib/utilities/errors';

import type { ApplicationUpdateData } from '../interfaces';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from '../shared';

export async function updateApplication ({ applicationId, message }: ApplicationUpdateData): Promise<Application> {

  if (!message || message.length < MINIMUM_APPLICATION_MESSAGE_CHARACTERS) {
    throw new StringTooShortError();
  }

  try {
    const updated = await prisma.application.update({
      where: {
        id: applicationId
      },
      data: {
        message
      }
    });

    return updated;
  }
  catch (err) {
    throw new DataNotFoundError(`Application with id ${applicationId} not found`);
  }

}
