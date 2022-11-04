import { prisma } from 'db';
import { NotFoundError } from 'lib/middleware';
import { UndesirableOperationError } from 'lib/utilities/errors';

import { UNHIDEABLE_MEMBER_PROPERTIES } from './constants';
import type { UpdateMemberPropertyVisibilityPayload } from './interfaces';

export async function updateMemberPropertyVisibility ({
  memberPropertyId,
  view,
  visible
}: UpdateMemberPropertyVisibilityPayload) {
  const memberProperty = await prisma.memberProperty.findUnique({
    where: {
      id: memberPropertyId
    },
    select: {
      enabledViews: true,
      type: true
    }
  });

  if (!memberProperty) {
    throw new NotFoundError();
  }

  const enabledViews = memberProperty?.enabledViews ?? [];

  if (UNHIDEABLE_MEMBER_PROPERTIES.includes(memberProperty.type)) {
    throw new UndesirableOperationError(`${memberProperty.type} property visibility can't be updated`);
  }

  await prisma.memberProperty.update({
    where: {
      id: memberPropertyId
    },
    data: {
      enabledViews: visible ? [...enabledViews, view] : enabledViews.filter(enabledView => enabledView !== view)
    }
  });
}
