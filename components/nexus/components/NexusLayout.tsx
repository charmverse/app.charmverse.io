import type { ReactNode } from 'react';

import PageLayout from 'components/common/PageLayout';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useUser } from 'hooks/useUser';

import NexusSidebar from './NexusSidebar';

const emptySidebar = () => <div></div>;

export default function NexusLayout (props: { children: ReactNode }) {

  // hide sidebar for public users for now, since they can't create a workspace
  const { user } = useUser();

  return (
    <PageLayout sidebarWidth={user ? 55 : 0} sidebar={user ? NexusSidebar : emptySidebar}>
      <CenteredPageContent>
        {props.children}
      </CenteredPageContent>
    </PageLayout>
  );
}
