import { createCuid } from '@packages/utils/cuid';

import { prisma } from '@charmverse/core/prisma-client';

export async function populateReferralCodes() {
  const scouts = await prisma.scout.findMany({});

  for (const scout of scouts) {
    if (!scout.referralCode) {
      const referralCode = createCuid();

      await prisma.scout.update({
        where: { id: scout.id },
        data: { referralCode }
      });
    }
  }

  console.log('Referral codes populated');
}

// populateReferralCodes();
