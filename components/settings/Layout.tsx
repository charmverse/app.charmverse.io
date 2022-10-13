import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import PageLayout from 'components/common/PageLayout';

import { SETTINGS_TABS } from './pages';

const ScrollableWindow = styled.div`
  flex-grow: 1;
  overflow: auto;
`;

const Container = styled(Box)`
  width: 800px;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing(3)};
`;

const NavigationContainer = styled(Box)`
  background-color: ${({ theme }) => theme.palette.settingsHeader.background};
  padding-top: ${({ theme }) => theme.spacing(4)};
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
`;

export default function SettingsLayout ({ children }: { children: ReactNode }) {

  const router = useRouter();
  const [tab, setTab] = useState(getCurrentTabValue(router.pathname));
  const { domain } = router.query;

  useEffect(() => {
    setTab(getCurrentTabValue(router.pathname));
  }, [router.pathname]);

  function getCurrentTabValue (pathname: string) {
    const tabConfig = SETTINGS_TABS.find(t => pathname.includes(t.path)) || SETTINGS_TABS[0];
    return SETTINGS_TABS.indexOf(tabConfig);
  }

  return (
    <PageLayout>
      <ScrollableWindow>
        <NavigationContainer>
          <Container>
            <Tabs
              value={tab}
              indicatorColor='primary'
              sx={{ minHeight: 44 }}
              variant='scrollable'
              scrollButtons={false}
              aria-label='Setting tabs'
            >
              {/* combining next links with MUI tabs - https://stackoverflow.com/questions/65471275/material-ui-tabs-with-nextjs */}
              {SETTINGS_TABS.map(({ icon, path, label }) => (
                <Link href={`/${domain}/settings/${path}`} passHref key={label}>
                  <Tab icon={icon} iconPosition='start' component='a' disableRipple label={label} sx={{ px: 1.5, fontSize: 14, minHeight: 0 }} />
                </Link>
              ))}
            </Tabs>
          </Container>
        </NavigationContainer>
        <Container>
          {children}
        </Container>
        <Box pb={8} />
      </ScrollableWindow>
    </PageLayout>
  );
}
