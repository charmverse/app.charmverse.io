import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';

import { getKycCredentials, type KycCredentials } from './getKycCredentials';

export async function upsertKycCredentials({ spaceId, ...payload }: KycCredentials & { spaceId: string }) {
  if (payload.synaps) {
    await prisma.synapsCredential.upsert({
      where: {
        spaceId
      },
      create: {
        ...payload.synaps,
        spaceId
      },
      update: {
        ...payload.synaps
      }
    });
  }

  if (payload.persona) {
    await prisma.personaCredential.upsert({
      where: {
        spaceId
      },
      create: {
        ...payload.persona,
        spaceId
      },
      update: {
        ...payload.persona
      }
    });
  }

  if (!payload.synaps && !payload.persona) {
    throw new InvalidInputError('No credentials provided');
  }

  return getKycCredentials(spaceId);
}
