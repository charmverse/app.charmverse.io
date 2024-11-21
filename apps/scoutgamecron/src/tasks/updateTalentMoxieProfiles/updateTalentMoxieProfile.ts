import { prisma } from '@charmverse/core/prisma-client';
import { getMoxieFanToken } from '@packages/scoutgame/moxie/getMoxieFanToken';
import { getTalentProfile } from '@packages/scoutgame/talent/getTalentProfile';

export async function updateTalentProfile({
  builderId,
  farcasterId,
  wallets
}: {
  builderId: string;
  farcasterId: number | null;
  wallets: string[];
}) {
  const talentProfile = await getTalentProfile({
    farcasterId,
    wallets
  });

  if (talentProfile) {
    await prisma.talentProfile.upsert({
      where: { id: talentProfile.id },
      create: {
        id: talentProfile.id,
        builderId,
        score: talentProfile.score
      },
      update: {
        score: talentProfile.score
      }
    });
  }
}

export async function updateMoxieProfile({ farcasterId, builderId }: { farcasterId: number; builderId: string }) {
  const moxieToken = await getMoxieFanToken(farcasterId);
  if (!moxieToken) {
    return;
  }
  await prisma.moxieProfile.upsert({
    where: {
      id: farcasterId
    },
    update: {
      builderId
    },
    create: {
      id: farcasterId,
      builderId
    }
  });
}
