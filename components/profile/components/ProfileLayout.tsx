import PageLayout, { ScrollableWindow } from 'components/common/PageLayout';
import { Box } from '@mui/material';
import ProfileSidebar from './ProfileSidebar';

export default function ProfileLayout (props: { children: React.ReactNode }) {
  return (
    <PageLayout hideDrawerOnSmallScreen drawerWidth={55} sidebar={ProfileSidebar}>
      <ScrollableWindow>
        <Box py={3} sx={{ px: { xs: '20px', sm: '40px' } }}>
          {props.children}
        </Box>
      </ScrollableWindow>
    </PageLayout>
  );
}
