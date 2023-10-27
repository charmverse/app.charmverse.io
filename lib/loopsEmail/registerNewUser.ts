import type { Space } from '@charmverse/core/prisma';

import { stringToHumanFormat } from 'lib/metrics/mixpanel/utils';

import { isEnabled, createContact } from './client';
import type { LoopsUser, UserFields } from './client';

type SpaceFields = Pick<Space, 'name'>;

export async function registerNewUser({
  space,
  spaceTemplate,
  isAdmin,
  user
}: {
  space: SpaceFields;
  spaceTemplate?: string;
  isAdmin: boolean;
  user: UserFields;
}) {
  if (!isEnabled) {
    return { success: false };
  }
  return createContact({
    ...getLoopsUser(user),
    source: 'Web App',
    spaceRole: isAdmin ? 'Admin' : 'Member',
    spaceName: space.name,
    spaceTemplate: spaceTemplate ? stringToHumanFormat(spaceTemplate) : undefined
  });
}

// utils
function getLoopsUser(user: UserFields): Pick<LoopsUser, 'email' | 'createdAt' | 'firstName'> {
  if (!user.email) {
    throw new Error('User does not have an email');
  }
  return {
    firstName: user.username,
    email: user.email,
    createdAt: user.createdAt.toISOString()
  };
}
