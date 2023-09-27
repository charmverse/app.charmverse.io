import Grid from '@mui/material/Grid';

import { useGetRewardPermissions } from 'charmClient/hooks/rewards';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { ScrollableWindow } from 'components/common/PageLayout';
import { useApplication } from 'components/rewards/hooks/useApplication';

import { RewardApplicationStatusChip } from '../RewardApplicationStatusChip';

import { ApplicationComments } from './ApplicationComments';
import ApplicationInput from './RewardApplicationInput';
import SubmissionInput from './RewardSubmissionInput';

type Props = {
  applicationId: string;
};

export function RewardApplicationPageComponent({ applicationId }: Props) {
  const { application, refreshApplication } = useApplication({ applicationId });

  const { data: permissions } = useGetRewardPermissions({ rewardId: application?.bountyId });

  if (!application) {
    return null;
  }
  return (
    <ScrollableWindow>
      {/** TODO - Use more elegant layout */}
      <Grid container px='10%'>
        <Grid item xs={12}>
          <PageTitleInput onChange={() => null} value='Application / Submission for {Bounty}' readOnly />
          <RewardApplicationStatusChip status={application.status} />
        </Grid>
        <Grid item xs={12}>
          <p>-------------</p>
          <p>TODO - Add Bounty properties here</p>
          <p>-------------</p>
        </Grid>
        <Grid item xs={12}>
          <ApplicationInput
            refreshApplication={refreshApplication}
            bountyId={application.bountyId}
            permissions={permissions}
          />
        </Grid>
        <Grid item xs={12}>
          <SubmissionInput
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
