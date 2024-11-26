'use client';

import { styled } from '@mui/material/styles';
import { useState, useCallback, useEffect } from 'react';

import { SiteNavigation } from 'components/common/SiteNavigation';

const StickyContainer = styled('footer')`
  position: sticky;
  bottom: 0;
  z-index: 1000;
  width: 100%;
`;

export function StickyFooter() {
  const [paddingBottom, setPaddingBottom] = useState(0);
  const handleSafeAreaChanged = useCallback(() => {
    // console.log('safeAreaChanged', this.safeAreaInset);
    // console.log('safeAreaChanged', e);
    // @ts-ignore
    // eslint-disable-next-line react/no-this-in-sfc
    setPaddingBottom(this.safeAreaInset.bottom);
    // @ts-ignore - https://core.telegram.org/bots/webapps#events-available-for-mini-apps
    window.Telegram.WebApp.sendData(selectedRegions);
  }, [setPaddingBottom]);

  // add some padding for the bottom nav on mobile ios
  useEffect(() => {
    // console.log('adding safeAreaChanged listener');
    // @ts-ignore
    if (window.Telegram?.WebApp) {
      // @ts-ignore - https://core.telegram.org/bots/webapps#events-available-for-mini-apps
      window.Telegram.WebApp.onEvent('safeAreaChanged', handleSafeAreaChanged);
    }
    return () => {
      // @ts-ignore - https://core.telegram.org/bots/webapps#events-available-for-mini-apps
      window.Telegram.WebApp.offEvent('safeAreaChanged', handleSafeAreaChanged);
    };
  }, [handleSafeAreaChanged]);

  return (
    <StickyContainer style={{ paddingBottom }}>
      <SiteNavigation />
    </StickyContainer>
  );
}
