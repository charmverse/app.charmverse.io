import { prisma } from "@charmverse/core/prisma-client";
import { updateUserProfile } from "@packages/mixpanel/updateUserProfile";

export async function createScoutMixpanelProfiles() {
  const scouts = await prisma.scout.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      farcasterId: true,
      builderStatus: true,
    }
  });

  for (const scout of scouts) {
    await updateUserProfile(scout.id, {
      builderStatus: scout.builderStatus,
      username: scout.username,
      displayName: scout.displayName,
      farcasterId: scout.farcasterId,
      userId: scout.id,
    })
  }
}