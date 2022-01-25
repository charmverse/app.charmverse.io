import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { PageLayout } from '../common/page-layout';
import Container from './ContentContainer';
import { lighterGreyColor } from 'theme/colors';

const SETTINGS_TABS = [
  { path: '/settings/account', label: 'My account' },
  { path: '/settings/workspace', label: 'Workspace' },
  { path: '/settings/members', label: 'Members' },
];

const NavigationContainer = styled(Box)`
  background-color: ${lighterGreyColor};
  padding-top: ${({ theme }) => theme.spacing(6)};
`;

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
      <NavigationContainer>
        <Container>
          <Tabs value={tab}>
            {/* combining next links with MUI tabs - https://stackoverflow.com/questions/65471275/material-ui-tabs-with-nextjs */}
            {SETTINGS_TABS.map(({ path, label }) => (
              <Link href={path} passHref key={label}>
                <Tab component='a' disableRipple label={label} />
              </Link>
            ))}
          </Tabs>
        </Container>
      </NavigationContainer>
      <Container>
        {children}
      </Container>
    </PageLayout>
  )
}
