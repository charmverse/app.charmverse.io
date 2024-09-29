'use client';

import type { Scout } from '@charmverse/core/prisma-client';

import { Carousel } from 'components/common/Carousel/Carousel';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCard } from '../../../common/Card/BuilderCard/BuilderCard';

export function BuildersCarousel({ builders, user }: { builders: BuilderInfo[]; user: Scout | null }) {
  const isMobile = useMdScreen();

  return (
    <Carousel>
      {builders.map((builder) => (
        <BuilderCard
          size={!isMobile ? 'small' : 'large'}
          key={builder.id}
          builder={builder}
          showPurchaseButton
          user={user}
          showHotIcon
        />
      ))}
    </Carousel>
  );
}
