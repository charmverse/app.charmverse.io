'use client';

import { BuildersGallery } from 'components/common/Gallery/BuildersGallery';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderInfo } from 'lib/builders/interfaces';

export const dynamic = 'force-dynamic';

export function BuildersGalleryContainer({
  builders,
  showHotIcon,
  userId
}: {
  builders: BuilderInfo[];
  showHotIcon: boolean;
  userId?: string;
}) {
  const isDesktop = useMdScreen();
  return (
    <BuildersGallery
      builders={builders}
      showHotIcon={showHotIcon}
      size={isDesktop ? 'medium' : 'small'}
      columns={5}
      userId={userId}
    />
  );
}
