import { ReactElement } from 'react';
import PageLayout from 'components/profile/components/ProfileLayout';
import TasksList from 'components/profile/tasks';

export default function TasksPage () {
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
