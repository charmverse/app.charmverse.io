'use client';

import { SiteNavigation } from 'components/common/SiteNavigation';
import { useMdScreen } from 'hooks/useMediaScreens';

export function HeaderMenu() {
  const isDesktop = useMdScreen();

  return isDesktop ? <SiteNavigation transparent={true} /> : null;
}
