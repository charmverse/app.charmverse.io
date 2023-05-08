import type { Application } from '@charmverse/core/prisma';
import { useEffect } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';

type Props = {
  application: Application;
  onRefresh: () => void;
};

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
