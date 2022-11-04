import { prisma } from 'db';

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
      enabledViews: true
    }
  });

  const enabledViews = memberProperty?.enabledViews ?? [];

  await prisma.memberProperty.update({
    where: {
      id: memberPropertyId
    },
    data: {
      enabledViews: visible ? [...enabledViews, view] : enabledViews.filter(enabledView => enabledView !== view)
    }
  });
}
