import { ReactElement } from 'react';
import Box from '@mui/material/Box';
import PageLayout from 'components/common/PageLayout';
import { setTitle } from 'hooks/usePageTitle';
import { ProfileHeader } from 'components/profile';
import TasksList from 'components/profile/tasks';
import { Task } from 'models';
import { useTasks } from 'hooks/useTasks';

export default function TasksPage () {
  const tasks: Task[] = useTasks();

  setTitle('Tasks');

  return (
    <Box py={3} px='80px'>
      <ProfileHeader name='Bill Murray' profileImageURL='http://www.fillmurray.com/200/300' />
      <TasksList tasks={tasks} />
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
