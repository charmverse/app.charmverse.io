'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { TabsMenu } from '../common/Tabs/TabsMenu';

export function PublicProfileTabsMenu({
  tab,
  path,
  isApprovedBuilder
}: {
  tab: string;
  path: string;
  isApprovedBuilder?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isApprovedBuilder && tab === 'builder') {
      router.push(`/u/${path}/?tab=scout`);
    }
  }, [isApprovedBuilder, tab, path]);

  return (
    <TabsMenu
      value={tab}
      tabs={[
        { value: 'scout', label: 'Scout' },
        ...(isApprovedBuilder ? [{ value: 'builder', label: 'Builder' }] : [])
      ]}
    />
  );
}
