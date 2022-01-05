import Head from 'next/head';
import React from 'react';
import Box from '@mui/material/Box';
import PrimaryNavigation from '../components/PrimaryNavigation';
import SecondaryNavigation from '../components/SecondaryNavigation';
import styled from '@emotion/styled';
import { backgroundBlack, lightGreyColor } from '../theme/colors';

const PageContainer = styled.div`
  background: ${lightGreyColor};
`;

const Header = styled.header`
  align-items: center;
  display: flex;
  height: 14em;
  justify-content: center;
  position: relative;
  z-index: 1;
  background: #000;
  background-image: url("/images/background.jpg");
  background-repeat: no-repeat;
  background-position: center -160px;
  background-size: auto;

`;

export const PageHeader: React.FC<{ className?: string }> = ({ children, className }) => {
  return (
    <Header className={className}>
      <PageSection style={{ background: 'transparent' }}>
        {children}
      </PageSection>
    </Header>
  );
};

export const PageSection = styled(Box)<{ backgroundColor?: string, width?: number }>`
  margin-left: auto;
  margin-right: auto;
  max-width: 100%;
  overflow: visible;
  width: ${props => props.width || 800}px;
  padding-left: 15px;
  padding-right: 15px;
  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding-left: 30px;
    padding-right: 30px;
  }
`;


const Page: React.FC<{ title: string, path?: string }> = ({ title, children }) => {
  return (<>
    <Head>
      <title>{title} | CharmVerse</title>
    </Head>
    <PageContainer>

      <Box sx={{ background: 'white', py: 5 }}>
        <PrimaryNavigation />
      </Box>
      {children}
      <Box sx={{ background: backgroundBlack }}>
        <PageSection backgroundColor={backgroundBlack}>
          <SecondaryNavigation />
        </PageSection>
      </Box>
    </PageContainer>
  </>);
}

export default Page;