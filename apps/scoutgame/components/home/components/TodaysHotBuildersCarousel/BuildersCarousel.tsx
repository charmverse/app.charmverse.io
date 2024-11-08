'use client';

import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';
import { Carousel } from 'components/common/Carousel/Carousel';
import { useIsMounted } from 'hooks/useIsMounted';
import { useLgScreen, useMdScreen } from 'hooks/useMediaScreens';
import { useTrackEvent } from 'hooks/useTrackEvent';
import type { BuilderInfo } from 'lib/builders/interfaces';

import { PromoCard } from './PromoCard';

export function BuildersCarousel({ builders }: { builders: BuilderInfo[] }) {
  const isMdScreen = useMdScreen();
  const isLgScreen = useLgScreen();

  const trackEvent = useTrackEvent();
  const size = isLgScreen ? 'large' : isMdScreen ? 'small' : 'x-small';
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <Carousel>
      {[
        <PromoCard
          data-test='promo-card-optimism'
          key='op-new-scout-ad'
          size={size}
          path='/info/partner-rewards/optimism'
          src='/images/home/op-new-scout-ad.png'
          onClick={() => {
            trackEvent('click_optimism_promo');
          }}
        />,
        <PromoCard
          data-test='promo-card-moxie'
          key='moxie-fan-reward-ad'
          size={size}
          path='/info/partner-rewards/moxie'
          src='/images/home/moxie-fan-reward-ad.png'
          onClick={() => {
            trackEvent('click_moxie_promo');
          }}
        />,
        ...builders.map((builder) => (
          <BuilderCard size={size} key={builder.id} builder={builder} showPurchaseButton showHotIcon />
        ))
      ]}
    </Carousel>
  );
}
