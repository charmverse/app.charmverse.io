import PageLayout, { ScrollableWindow } from 'components/common/PageLayout';
import { Box } from '@mui/material';
import styled from '@emotion/styled';
import { useUser } from 'hooks/useUser';
import ProfileSidebar from './ProfileSidebar';

const Container = styled(Box)`
  width: 1200px;
  max-width: 100%;
`;

const emptySidebar = () => <div></div>;

export default function ProfileLayout (props: { children: React.ReactNode }) {

  // hide sidebar for public users for now, since they can't create a workspace
  const [user] = useUser();

  return (
    <PageLayout hideSidebarOnSmallScreen sidebarWidth={user ? 55 : 0} sidebar={user ? ProfileSidebar : emptySidebar}>
      <ScrollableWindow>
        <Container py={3} sx={{ px: { xs: '20px', sm: '80px' } }} mx='auto' mb={10}>
          {props.children}
        </Container>
      </ScrollableWindow>
    </PageLayout>
  );
}
