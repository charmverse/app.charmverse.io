'use client';

import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { useIsMounted } from '../../../hooks/useIsMounted';
import { useLgScreen, useMdScreen } from '../../../hooks/useMediaScreens';
import { useTrackEvent } from '../../../hooks/useTrackEvent';
import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../common/Carousel/Carousel';
import { LoadingCards } from '../../common/Loading/LoadingCards';

import { PromoCard } from './PromoCard';

const secondPromoInsertIndex = 4;

export function BuildersCarousel({
  builders,
  showPromoCards = false
}: {
  builders: BuilderInfo[];
  showPromoCards?: boolean;
}) {
  const isDesktop = useMdScreen();
  const isLgScreen = useLgScreen();
  const trackEvent = useTrackEvent();
  const size = isLgScreen ? 'large' : isDesktop ? 'small' : 'x-small';
  const isMounted = useIsMounted();

  if (!isMounted) {
    // This is returned to prevent a layout shift when the carousel is mounted
    return <LoadingCards />;
  }

  const slidesPerView = isDesktop ? 3 : 2;

  const builderCards = showPromoCards
    ? [
        ...[
          showPromoCards
            ? [
                <PromoCard
                  data-test='promo-card-optimism'
                  key='op-new-scout-ad'
                  size={size}
                  path='/info/partner-rewards/optimism'
                  src='/images/home/op-new-scout-ad.png'
                  onClick={() => {
                    trackEvent('click_optimism_promo');
                  }}
                />
              ]
            : []
        ],
        ...builders
          .slice(0, secondPromoInsertIndex)
          .map((builder) => (
            <BuilderCard size={size} key={builder.id} builder={builder} showPurchaseButton showHotIcon />
          )),
        ...(showPromoCards
          ? [
              <PromoCard
                data-test='promo-card-moxie'
                key='moxie-fan-reward-ad'
                size={size}
                path='/info/partner-rewards/moxie'
                src='/images/home/moxie-fan-reward-ad.png'
                onClick={() => {
                  trackEvent('click_moxie_promo');
                }}
              />
            ]
          : []),
        ...builders
          .slice(secondPromoInsertIndex)
          .map((builder) => (
            <BuilderCard size={size} key={builder.id} builder={builder} showPurchaseButton showHotIcon />
          ))
      ]
    : builders.map((builder) => (
        <BuilderCard size={size} key={builder.id} builder={builder} showPurchaseButton showHotIcon />
      ));

  return (
    <Carousel slidesPerView={slidesPerView} boxProps={{ width: { xs: '100%', md: '90%' }, margin: '0 auto' }}>
      {builderCards}
    </Carousel>
  );
}
