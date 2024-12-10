'use client';

import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { useIsMounted } from '../../../hooks/useIsMounted';
import { useLgScreen, useMdScreen } from '../../../hooks/useMediaScreens';
import { useTrackEvent } from '../../../hooks/useTrackEvent';
import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';
import { Carousel } from '../../common/Carousel/Carousel';
import { LoadingCards } from '../../common/Loading/LoadingCards';

import { PromoCard } from './PromoCard';

const promoInsertIndex = 2;

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
  const builderCardsList = builders.map((builder) => (
    <BuilderCard size={size} key={builder.id} builder={builder} showPurchaseButton showHotIcon />
  ));

  const builderCards = showPromoCards
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
        />,
        ...builderCardsList.slice(0, promoInsertIndex),
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
        ...builderCardsList.slice(promoInsertIndex, promoInsertIndex * 2),
        <PromoCard
          data-test='promo-card-glo'
          key='glo-ad'
          size={size}
          path='/info/partner-rewards/glo'
          src='/images/home/glo-ad.png'
          onClick={() => {
            trackEvent('click_moxie_promo');
          }}
        />,
        ...builderCardsList.slice(promoInsertIndex * 2)
      ]
    : builderCardsList;

  return (
    <Carousel
      slidesPerView={slidesPerView}
      boxProps={{ width: { xs: '100%', md: '90%' }, margin: '0 auto' }}
      showMobileNavigationArrows
      autoplay
    >
      {builderCards}
    </Carousel>
  );
}
