import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Collapse, Divider, FormLabel, IconButton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useState } from 'react';

import { useGetReward } from 'charmClient/hooks/rewards';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { CharmEditor } from 'components/common/CharmEditor';
import { ScrollableWindow } from 'components/common/PageLayout';
import UserDisplay from 'components/common/UserDisplay';
import { RewardProperties } from 'components/rewards/components/RewardProperties/RewardProperties';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useMembers } from 'hooks/useMembers';
import { usePage } from 'hooks/usePage';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { ApplicationComments } from './ApplicationComments';
import ApplicationInput from './RewardApplicationInput';
import RewardReview from './RewardReview';
import SubmissionInput from './RewardSubmissionInput';

type Props = {
  applicationId: string;
};

export function RewardApplicationPageComponent({ applicationId }: Props) {
  const { application, refreshApplication, applicationRewardPermissions, updateApplication } = useApplication({
    applicationId
  });
  const { data: reward } = useGetReward({ rewardId: application?.bountyId });

  const { page: rewardPageContent } = usePage({ pageIdOrPath: reward?.id });

  const { members } = useMembers();
  const { user } = useUser();

  const [showProperties, setShowProperties] = useState(false);

  if (!application || !reward) {
    return null;
  }

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
          <PageTitleInput value={reward.page.title} readOnly onChange={() => null} />
        </Grid>

        <Grid item xs={12} className='focalboard-body' flexDirection='column'>
          <Stack
            direction='row'
            gap={1}
            alignItems='center'
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowProperties((v) => !v)}
          >
            <FormLabel sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Reward Details</FormLabel>
            <IconButton size='small'>
              <KeyboardArrowDown
                fontSize='small'
                sx={{ transform: `rotate(${showProperties ? 180 : 0}deg)`, transition: 'all 0.2s ease' }}
              />
            </IconButton>
          </Stack>
          <Collapse in={showProperties} timeout='auto' unmountOnExit>
            <Stack>
              <RewardProperties
                rewardId={reward.id}
                pageId={reward.page.id}
                pagePath={reward.page.path}
                readOnly={true}
                refreshRewardPermissions={() => {}}
              />
              {rewardPageContent && (
                <>
                  <CharmEditor
                    pageId={rewardPageContent.id}
                    readOnly
                    content={rewardPageContent.content as PageContent}
                  />
                  <Divider sx={{ mt: 2 }} />
                </>
              )}
            </Stack>
          </Collapse>
        </Grid>

        <Grid item xs={12} gap={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display='flex' gap={2}>
            <FormLabel sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Applicant</FormLabel>
            <UserDisplay user={submitter} avatarSize='small' showMiniProfile />
          </Box>

          {/** This section contaisn all possible reviewer actions */}
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

        {application.reward.approveSubmitters && (
          <Grid item xs={12}>
            <ApplicationInput
              application={application}
              refreshApplication={refreshApplication}
              bountyId={application.bountyId}
              permissions={applicationRewardPermissions}
            />
          </Grid>
        )}

        {application.status !== 'applied' && (
          <Grid item xs={12}>
            <SubmissionInput
              submission={application}
              readOnly={readonlySubmission}
              expandedOnLoad
              refreshSubmission={refreshApplication}
              bountyId={application.bountyId}
              permissions={applicationRewardPermissions}
              hasCustomReward={!!application.reward.customReward}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <ApplicationComments applicationId={application.id} status={application.status} />
        </Grid>
      </Grid>
    </ScrollableWindow>
  );
}
