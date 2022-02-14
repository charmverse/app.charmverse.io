import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import AccountIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/WorkOutline';
import PersonIcon from '@mui/icons-material/Group';
import { PageLayout } from '../common/page-layout';

const SETTINGS_TABS = [
  { icon: <AccountIcon fontSize='small' />, path: 'account', label: 'My account' },
  { icon: <SettingsIcon fontSize='small' />, path: 'workspace', label: 'Workspace' },
  { icon: <PersonIcon fontSize='small' />, path: 'contributors', label: 'Contributors' }
];

const Container = styled.div`
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
      <NavigationContainer>
        <Container>
          <Tabs value={tab} indicatorColor='primary' sx={{ minHeight: 44 }}>
            {/* combining next links with MUI tabs - https://stackoverflow.com/questions/65471275/material-ui-tabs-with-nextjs */}
            {SETTINGS_TABS.map(({ icon, path, label }) => (
              <Link href={`/${domain}/settings/${path}`} passHref key={label}>
                <Tab icon={icon} iconPosition='start' component='a' disableRipple label={label} sx={{ fontSize: 14, minHeight: 0 }} />
              </Link>
            ))}
          </Tabs>
        </Container>
      </NavigationContainer>
      <Container>
        {children}
      </Container>
    </PageLayout>
  );
}
