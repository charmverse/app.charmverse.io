'use client';

import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';
import { Carousel } from 'components/common/Carousel/Carousel';
import { useIsMounted } from 'hooks/useIsMounted';
import { useLgScreen, useMdScreen } from 'hooks/useMediaScreens';
import { useTrackEvent } from 'hooks/useTrackEvent';

import { PromoCard } from './PromoCard';

const secondPromoInsertIndex = 4;

export function BuildersCarousel({
  builders,
  showPromoCards = false
}: {
  builders: BuilderInfo[];
  showPromoCards?: boolean;
}) {
  const isMdScreen = useMdScreen();
  const isLgScreen = useLgScreen();

  const trackEvent = useTrackEvent();
  const size = isLgScreen ? 'large' : isMdScreen ? 'small' : 'x-small';
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

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

  return <Carousel>{builderCards}</Carousel>;
}
