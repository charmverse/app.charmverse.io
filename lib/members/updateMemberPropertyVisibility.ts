import { prisma } from 'db';

import type { UpdateMemberPropertyVisibilityPayload } from './interfaces';

export async function updateMemberPropertyVisibility ({
  memberPropertyId,
  view,
  visible
}: UpdateMemberPropertyVisibilityPayload) {

  if (visible) {
    await prisma.memberPropertyVisibility.create({
      data: {
        memberPropertyId,
        view
      }
    });
  }
  else {
    await prisma.memberPropertyVisibility.deleteMany({
      where: {
        memberPropertyId,
        view
      }
    });
  }
}
