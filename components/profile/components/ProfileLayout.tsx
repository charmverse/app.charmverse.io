import PageLayout, { ScrollableWindow } from 'components/common/PageLayout';
import { Box } from '@mui/material';
import styled from '@emotion/styled';
import ProfileSidebar from './ProfileSidebar';

// const Container = styled.div`
//   width: 1105px;
//   padding: 0 80px;
//   margin: 0 auto;
//   ${({ theme }) => `
//     ${theme.breakpoints.down('md')} {
//       width: 100%;
//       padding: 0 10px;
//     }
//   `}
// `;

const Container = styled(Box)`
  width: 1200px;
  max-width: 100%;
  margin: 0 auto;
`;

export default function ProfileLayout (props: { children: React.ReactNode }) {
  return (
    <PageLayout hideSidebarOnSmallScreen sidebarWidth={55} sidebar={ProfileSidebar}>
      <ScrollableWindow>
        <Container py={3} sx={{ px: { xs: '20px', sm: '80px' } }}>
          {props.children}
        </Container>
      </ScrollableWindow>
    </PageLayout>
  );
}
