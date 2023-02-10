import type { SpaceEntity } from 'serverless/webhook/interfaces';

import { prisma } from 'db';

export async function getWebhookSpaceEntity(spaceId: string): Promise<SpaceEntity> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    }
  });
  return {
    id: space.id,
    name: space.name,
    avatar: space.spaceImage,
    url: `https://app.charmverse.io/${space.domain}`
  };
}
