import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { sessionUserRelations } from 'lib/session/config';
import type { LoggedInUser } from 'models';

export async function getUserProfile (key: 'id' | 'addresses', value: string): Promise<LoggedInUser> {

  const query: Prisma.UserWhereInput = {};

  if (!value) {
    throw {
      error: 'Invalid query'
    };
  }

  if (key === 'addresses') {
    query.wallets = {
      some: {
        address: value
      }
    };
  }
  else {
    query.id = value;
  }

  const profile = await prisma.user.findFirst({
    where: query,
    include: sessionUserRelations
  });

  if (!profile) {
    throw {
      error: 'User not found'
    };
  }
  return profile;
}

