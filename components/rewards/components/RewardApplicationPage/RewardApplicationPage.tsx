import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import Grid from '@mui/material/Grid';
import { useCallback, useMemo } from 'react';

import { useGetRewardPermissions } from 'charmClient/hooks/rewards';
import { PageTitleInput, StyledReadOnlyTitle } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { ScrollableWindow } from 'components/common/PageLayout';
import UserDisplay from 'components/common/UserDisplay';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';

import { RewardApplicationStatusChip } from '../RewardApplicationStatusChip';

import { ApplicationComments } from './ApplicationComments';
import ApplicationInput from './RewardApplicationInput';
import SubmissionInput from './RewardSubmissionInput';

type Props = {
  applicationId: string;
};

export function RewardApplicationPageComponent({ applicationId }: Props) {
  const { application, refreshApplication } = useApplication({ applicationId });
  const { members } = useMembers();
  const { pages } = usePages();

  const { data: permissions } = useGetRewardPermissions({ rewardId: application?.bountyId });

  if (!application) {
    return null;
  }

  const rewardPage = pages[application.bountyId];

  const submitter = members.find((m) => m.id === application.createdBy);

  const titlePrefix =
    application.reward.approveSubmitters &&
    (application.status === 'applied' || (application.status === 'rejected' && !application.submissionNodes))
      ? 'Application'
      : 'Submission';

  const expandedSubmissionStatuses: ApplicationStatus[] = ['inProgress', 'complete', 'review', 'processing', 'paid'];

  return (
    <ScrollableWindow>
      {/** TODO - Use more elegant layout */}
      <Grid container px='10%' gap={2}>
        <Grid item xs={12} display='flex' justifyContent='space-between'>
          {rewardPage && <PageTitleInput value={rewardPage?.title} readOnly onChange={() => null} />}
        </Grid>
        <Grid item xs={12} gap={2} sx={{ display: 'flex', alignItems: 'center' }}>
          <h3>Applicant</h3>
          <UserDisplay user={submitter} showMiniProfile />
          <RewardApplicationStatusChip status={application.status} />
        </Grid>
        <Grid item xs={12}>
          <p>-------------</p>
          <p>TODO - Add Reward properties here</p>
          <p>-------------</p>
        </Grid>
        {application.reward.approveSubmitters && (
          <Grid item xs={12}>
            <ApplicationInput
              refreshApplication={refreshApplication}
              bountyId={application.bountyId}
              permissions={permissions}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <SubmissionInput
            expandedOnLoad={expandedSubmissionStatuses.includes(application.status)}
            refreshSubmission={refreshApplication}
            bountyId={application.bountyId}
            permissions={permissions}
            hasCustomReward={!!application.reward.customReward}
          />
        </Grid>
        <Grid item xs={12}>
          <ApplicationComments applicationId={application.id} status={application.status} />
        </Grid>
      </Grid>
    </ScrollableWindow>
  );
}
