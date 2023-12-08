import type { PrimaryMemberIdentity } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function updateSpacePrimaryMemberIdentity({
  spaceId,
  primaryMemberIdentity
}: {
  spaceId: string;
  primaryMemberIdentity?: PrimaryMemberIdentity;
}) {
  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      primaryMemberIdentity
    }
  });

  if (primaryMemberIdentity) {
    await prisma.memberProperty.updateMany({
      where: {
        type: primaryMemberIdentity
      },
      data: {
        required: true
      }
    });
  }
}
