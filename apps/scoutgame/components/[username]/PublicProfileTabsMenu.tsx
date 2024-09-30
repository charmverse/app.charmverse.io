'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { TabsMenu } from 'components/common/Tabs/TabsMenu';

export function PublicProfileTabsMenu({
  tab,
  username,
  isApprovedBuilder
}: {
  tab: string;
  username: string;
  isApprovedBuilder?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isApprovedBuilder && tab === 'builder') {
      router.push(`/u/${username}/?tab=scout`);
    }
  }, [isApprovedBuilder, tab, username]);

  return (
    <TabsMenu
      value={tab}
      tabs={[
        { value: 'scout', label: 'Scout', href: `/u/${username}/?tab=scout` },
        ...(isApprovedBuilder ? [{ value: 'builder', label: 'Builder', href: `/u/${username}/?tab=builder` }] : [])
      ]}
    />
  );
}
