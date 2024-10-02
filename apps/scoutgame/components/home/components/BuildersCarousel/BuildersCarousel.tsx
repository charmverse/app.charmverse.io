'use client';

import { Carousel } from 'components/common/Carousel/Carousel';
import { useMdScreen, useXsmScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCard } from '../../../common/Card/BuilderCard/BuilderCard';

export function BuildersCarousel({ builders, userId }: { builders: BuilderInfo[]; userId?: string }) {
  const isMdScreen = useMdScreen();
  const isXsmScreen = useXsmScreen();

  const size = !isXsmScreen ? 'x-small' : !isMdScreen ? 'small' : 'large';

  return (
    <Carousel>
      {builders.map((builder) => (
        <BuilderCard size={size} key={builder.id} builder={builder} showPurchaseButton showHotIcon userId={userId} />
      ))}
    </Carousel>
  );
}
