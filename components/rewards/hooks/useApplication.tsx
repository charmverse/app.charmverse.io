import type { Application } from '@charmverse/core/prisma-client';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useGetApplication } from 'charmClient/hooks/rewards';
import type { SubmissionUpdateData } from 'lib/applications/interfaces';

export function useApplication({ applicationId }: { applicationId: string }) {
  const { data: application, mutate: refreshApplication, isLoading } = useGetApplication({ applicationId });

  const updateApplication = useCallback(
    async (input: { applicationId: string; update: Partial<Application> }) => {
      await charmClient.rewards.updateApplication(input);
      refreshApplication();
    },
    [refreshApplication]
  );

  const updateSubmission = useCallback(
    async (input: SubmissionUpdateData) => {
      await charmClient.rewards.updateSubmission(input);
      refreshApplication();
    },
    [refreshApplication]
  );

  return {
    application,
    updateApplication,
    updateSubmission,
    refreshApplication
  };
}
