import { Feature, prisma } from '@charmverse/core/prisma-client';
import { STATIC_PAGES } from 'lib/features/constants';
import { memberProfileNames } from '@packages/profile/memberProfiles';

async function moveHiddenFeatures() {
  const spaces = await prisma.space.findMany({
    where: {
      deletedAt: null
    }
  });

  for (const space of spaces) {
    const hiddenFeatures = space.hiddenFeatures;
    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        features:
          hiddenFeatures && hiddenFeatures.length > 0
            ? STATIC_PAGES.map((page) => ({
                id: page.feature,
                isHidden: hiddenFeatures.includes(page.feature as Feature)
              }))
            : STATIC_PAGES.map((page) => ({ id: page.feature, isHidden: false })),
        memberProfiles: memberProfileNames.map((item) => ({ id: item, isHidden: false }))
      }
    });
  }

  console.log('Done! Processed ', spaces.length, ' spaces.');
}

moveHiddenFeatures();
