import type { ReactElement } from 'react';

import TasksList from 'components/nexus';
import PageLayout from 'components/nexus/components/NexusLayout';
import { setTitle } from 'hooks/usePageTitle';

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
