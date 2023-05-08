import type { Application } from '@charmverse/core/prisma';
import { useEffect } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';

type Props = {
  application: Application;
  onRefresh: () => void;
};

// This hook is used to refresh the application status when the user loads bounty application for the first time.
// If status is updated, it calls onRefresh callback and refreshes the bounty.
export const useRefreshApplicationStatus = ({ application, onRefresh }: Props) => {
  const { refreshBounty } = useBounties();
  const { data } = useSWRImmutable(
    application.status === 'processing' ? `applications-refresh-status/${application.id}` : null,
    () => charmClient.bounties.refreshApplicationStatus(application.id)
  );

  useEffect(() => {
    if (data && data?.status !== application.status) {
      onRefresh();
      refreshBounty(application.bountyId);
    }
  }, [data]);

  return { data, isLoading: !data };
};
