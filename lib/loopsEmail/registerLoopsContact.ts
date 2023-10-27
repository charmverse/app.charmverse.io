import type { Space } from '@charmverse/core/prisma';

import { stringToHumanFormat } from 'lib/metrics/mixpanel/utils';

import { isEnabled, createContact } from './client';
import type { UserFields } from './client';
import { getLoopsUser } from './utils';

type SpaceFields = Pick<Space, 'name'>;

export async function registerLoopsContact({
  isAdmin,
  space,
  spaceTemplate,
  user
}: {
  isAdmin: boolean;
  space: SpaceFields;
  spaceTemplate?: string;
  user: UserFields;
}) {
  if (!isEnabled) {
    return { success: false };
  }
  return createContact({
    ...getLoopsUser(user),
    source: 'Web App',
    spaceName: space.name,
    spaceRole: isAdmin ? 'Admin' : 'Member',
    spaceTemplate: spaceTemplate ? stringToHumanFormat(spaceTemplate) : undefined
  });
}
