import type { ReactElement } from 'react';
import { useEffect } from 'react';

import charmClient from 'charmClient';
import TasksList from 'components/nexus';
import PageLayout from 'components/nexus/components/NexusLayout';
import { setTitle } from 'hooks/usePageTitle';

export default function TasksPage () {

  setTitle('My Nexus');

  useEffect(() => {
    charmClient.track.trackAction('page_view', { type: 'nexus' });
  }, []);

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
