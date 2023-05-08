import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Head from 'next/head';
import Image from 'next/legacy/image';

import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import Button from 'components/common/Button';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import CurrentPageFavicon from 'components/common/PageLayout/components/CurrentPageFavicon';
import PageTitleWithBreadcrumbs from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import { StyledToolbar } from 'components/common/PageLayout/components/Header/Header';
import PageContainer from 'components/common/PageLayout/components/PageContainer';
import { AppBar, HeaderSpacer } from 'components/common/PageLayout/PageLayout';
import darkLogoImage from 'public/images/charmverse_logo_icon.png';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

type Props = {
  children: React.ReactNode;
  basePageId?: string;
};

const LogoImage = styled(Image)`
  margin-right: -6px !important;
  filter: ${({ theme }) => (theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)')};
`;

export function SharedPageLayout({ children, basePageId }: Props) {
  const logo = darkLogoImage;

  return (
    <DocumentPageProviders>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer data-test='public-page-layout'>
        <AppBar sidebarWidth={0} position='fixed' open={false}>
          <StyledToolbar variant='dense'>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                width: '100%'
              }}
            >
              <PageTitleWithBreadcrumbs pageId={basePageId} />
              <Button
                startIcon={<LogoImage width={32} height={32} src={logo} />}
                variant='text'
                color='inherit'
                href='/'
              >
                Try CharmVerse
              </Button>
            </Box>
          </StyledToolbar>
        </AppBar>

        <PageDialogProvider>
          <PageContainer>
            <HeaderSpacer />
            {children}
            <PageDialogGlobal />
          </PageContainer>
        </PageDialogProvider>
      </LayoutContainer>
    </DocumentPageProviders>
  );
}
