import PageLayout, { ScrollableWindow } from 'components/common/PageLayout';
import { Box } from '@mui/material';
import ProfileSidebar from './ProfileSidebar';

export default function ProfileLayout (props: { children: React.ReactNode }) {

  return (
    <PageLayout sidebar={ProfileSidebar}>
      <ScrollableWindow>
        <Box py={3} px='80px'>
          {props.children}
        </Box>
      </ScrollableWindow>
    </PageLayout>
  );
}
