import type { ReactElement } from 'react';
import PageLayout from 'components/nexus/components/NexusLayout';
import { setTitle } from 'hooks/usePageTitle';
import TasksList from 'components/nexus';

export default function TasksPage () {

  setTitle('My Nexus');

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
