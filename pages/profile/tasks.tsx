import { ReactElement } from 'react';
import Box from '@mui/material/Box';
import { PageLayout } from 'components/common/page-layout';
import { setTitle } from 'hooks/usePageTitle';
import { ProfileHeader, Task, TasksList } from 'components/profile';

const tasks: Task[] = [{
  id: '2a2b16ba-2a0e-458f-a6cd-24af8745dcf7',
  date: new Date(),
  description: 'Send 23.2 CHARM',
  links: [{
    id: 'd89de30b-0531-4321-a38c-73c9176d6bfa',
    name: 'Gnosis',
    url: 'https://gnosis-safe.io/app/'
  }, {
    id: '4ebbc49e-9703-4415-91f7-0e2022799c47',
    name: 'Bounty',
    url: 'https://app.charmverse.io/'
  }],
  type: 'Multisig',
  workspace: 'Bankless'
}];
export default function TasksPage () {

  setTitle('Tasks');

  return (
    <Box py={3} px='80px'>
      <ProfileHeader />
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
