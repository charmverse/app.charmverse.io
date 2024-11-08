'use client';

import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';
import { Carousel } from 'components/home/components/Carousel/Carousel';
import { useIsMounted } from 'hooks/useIsMounted';
import { useLgScreen, useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { AdCard } from './AdCard';

export function BuildersCarousel({ builders }: { builders: BuilderInfo[] }) {
  const isMdScreen = useMdScreen();
  const isLgScreen = useLgScreen();
  const size = isLgScreen ? 'large' : isMdScreen ? 'small' : 'x-small';
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <Carousel>
      {[
        <AdCard
          key='op-new-scout-ad'
          size={size}
          path='/info/partner-rewards/optimism'
          src='/images/home/op-new-scout-ad.png'
        />,
        <AdCard
          key='moxie-fan-reward-ad'
          size={size}
          path='/info/partner-rewards/moxie'
          src='/images/home/moxie-fan-reward-ad.png'
        />,
        ...builders.map((builder) => (
          <BuilderCard size={size} key={builder.id} builder={builder} showPurchaseButton showHotIcon />
        ))
      ]}
    </Carousel>
  );
}
