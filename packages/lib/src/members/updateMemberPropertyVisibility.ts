import { prisma } from '@charmverse/core/prisma-client';
import { NotFoundError } from '@packages/nextjs/errors';
import { UndesirableOperationError } from '@packages/utils/errors';

import { MEMBER_PROPERTY_CONFIG } from './constants';
import type { UpdateMemberPropertyVisibilityPayload } from './interfaces';

export async function updateMemberPropertyVisibility({
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

  if (MEMBER_PROPERTY_CONFIG[memberProperty.type]?.unhideable) {
    throw new UndesirableOperationError(`${memberProperty.type} property visibility can't be updated`);
  }

  return prisma.memberProperty.update({
    where: {
      id: memberPropertyId
    },
    data: {
      enabledViews: visible ? [...enabledViews, view] : enabledViews.filter((enabledView) => enabledView !== view)
    }
  });
}
