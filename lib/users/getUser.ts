import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import { MissingDataError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';

export async function getUserProfile(
  key: 'id' | 'addresses',
  value: string,
  tx: Prisma.TransactionClient = prisma
): Promise<LoggedInUser> {
  const query: Prisma.UserWhereInput = {};

  if (!value) {
    throw {
      error: 'Invalid query'
    };
  }

  if (key === 'addresses') {
    query.wallets = {
      some: {
        address: value.toLowerCase()
      }
    };
  } else {
    query.id = value;
  }

  const user = await tx.user.findFirst({
    where: query,
    include: sessionUserRelations
  });

  if (!user) {
    throw new MissingDataError(`User with ${key} ${value} not found`);
  }
  const { profile, ...restProfile } = user;
  const userProfile: LoggedInUser = { ...restProfile, preferences: profile };

  return userProfile;
}
