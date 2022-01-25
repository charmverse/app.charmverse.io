import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { PageLayout } from '../common/page-layout';
import TabPanel from './TabPanel';

const SETTINGS_TABS = [
  { path: '/settings/account', label: 'My account' },
  { path: '/settings/workspace', label: 'Workspace' },
  { path: '/settings/members', label: 'Members' },
];

export default function SettingsLayout ({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  const [tab, setTab] = useState(getCurrentTabValue(router.pathname));

  useEffect(() => {
    setTab(getCurrentTabValue(router.pathname));
  }, [router.pathname]);

  function getCurrentTabValue (pathname: string) {
    const tabConfig = SETTINGS_TABS.find(tab => tab.path === pathname) || SETTINGS_TABS[0];
    return SETTINGS_TABS.indexOf(tabConfig);
  }

  return (
    <PageLayout>
      <Tabs value={tab}>
        {/* combining next links with MUI tabs - https://stackoverflow.com/questions/65471275/material-ui-tabs-with-nextjs */}
        {SETTINGS_TABS.map(({ path, label }) => (
          <Link href={path} passHref key={label}>
            <Tab component='a' disableRipple label={label} />
          </Link>
        ))}
      </Tabs>
      <TabPanel>
        {children}
      </TabPanel>
    </PageLayout>
  )
}
