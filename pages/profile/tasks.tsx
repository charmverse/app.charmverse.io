import { ReactElement } from 'react';
import Box from '@mui/material/Box';
import { PageLayout } from 'components/common/page-layout';
import { setTitle } from 'hooks/usePageTitle';
import { ProfileHeader, TasksList } from 'components/profile';

export default function TasksPage () {

  setTitle('Tasks');

  return (
    <Box py={3} px='80px'>
      <ProfileHeader />
      <TasksList />
    </Box>
  );

}

TasksPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
