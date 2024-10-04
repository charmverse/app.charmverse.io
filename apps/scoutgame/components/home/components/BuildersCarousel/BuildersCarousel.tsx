'use client';

import { Carousel } from 'components/common/Carousel/Carousel';
import { useIsMounted } from 'hooks/useIsMounted';
import { useLgScreen, useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCard } from '../../../common/Card/BuilderCard/BuilderCard';

export function BuildersCarousel({ builders, userId }: { builders: BuilderInfo[]; userId?: string }) {
  const isMdScreen = useMdScreen();
  const isLgScreen = useLgScreen();
  const size = isLgScreen ? 'large' : isMdScreen ? 'small' : 'x-small';
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <Carousel>
      {builders.map((builder) => (
        <BuilderCard size={size} key={builder.id} builder={builder} showPurchaseButton showHotIcon userId={userId} />
      ))}
    </Carousel>
  );
}
