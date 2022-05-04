import { ReactElement } from 'react';
import PageLayout from 'components/profile/components/ProfileLayout';
import { setTitle } from 'hooks/usePageTitle';
import TasksList from 'components/profile/tasks';

export default function TasksPage () {

  setTitle('My Tasks');

  return (
    <TasksList />
  );

}

TasksPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
