import { ReactElement } from 'react';
import PageLayout from 'components/nexus/components/ProfileLayout';
import TasksList from 'components/nexus';

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
