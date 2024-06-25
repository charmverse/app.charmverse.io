import { MissingDataError } from '@charmverse/core/errors';
import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { sessionUserRelations } from 'lib/session/config';

import type { LoggedInUser } from './types';

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

  const profile = await tx.user.findFirst({
    where: query,
    include: sessionUserRelations
  });

  if (!profile) {
    throw new MissingDataError(`User with ${key} ${value} not found`);
  }

  return profile;
}
