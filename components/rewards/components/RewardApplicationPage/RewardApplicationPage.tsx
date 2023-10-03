import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { ScrollableWindow } from 'components/common/PageLayout';
import UserDisplay from 'components/common/UserDisplay';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';

import { ApplicationComments } from './ApplicationComments';
import ApplicationInput from './RewardApplicationInput';
import RewardReview from './RewardReview';
import SubmissionInput from './RewardSubmissionInput';

type Props = {
  applicationId: string;
};

export function RewardApplicationPageComponent({ applicationId }: Props) {
  const { application, refreshApplication, applicationRewardPermissions } = useApplication({
    applicationId
  });
  const { members } = useMembers();
  const { pages } = usePages();
  const { user } = useUser();

  if (!application) {
    return null;
  }

  const rewardPage = pages[application.bountyId];

  const submitter = members.find((m) => m.id === application.createdBy);

  const expandedSubmissionStatuses: ApplicationStatus[] = ['inProgress', 'complete', 'review', 'processing', 'paid'];

  const readonlySubmission =
    user?.id !== application.createdBy ||
    (['complete', 'paid', 'processing', 'rejected'] as ApplicationStatus[]).includes(application.status);

  return (
    <ScrollableWindow>
      {/** TODO - Use more elegant layout */}
      <Grid container px='10%' gap={2}>
        <Grid item xs={12} display='flex' justifyContent='space-between'>
          {rewardPage && <PageTitleInput value={rewardPage?.title} readOnly onChange={() => null} />}
        </Grid>
        <Grid item xs={12} gap={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display='flex' gap={2}>
            <h3>Applicant</h3>
            <UserDisplay user={submitter} showMiniProfile />
          </Box>

          {application.status === 'applied' && (
            <RewardReview
              onConfirmReview={() => null}
              reviewType='application'
              readOnly={!applicationRewardPermissions?.approve_applications}
            />
          )}
          {(application.status === 'review' || application.status === 'inProgress') && (
            <RewardReview
              onConfirmReview={() => null}
              reviewType='submission'
              readOnly={!applicationRewardPermissions?.review}
            />
          )}
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
              permissions={applicationRewardPermissions}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <SubmissionInput
            submission={application}
            readOnly={readonlySubmission}
            expandedOnLoad={expandedSubmissionStatuses.includes(application.status)}
            refreshSubmission={refreshApplication}
            bountyId={application.bountyId}
            permissions={applicationRewardPermissions}
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
