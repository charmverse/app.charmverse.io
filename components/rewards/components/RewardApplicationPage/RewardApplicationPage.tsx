import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import { KeyboardArrowDown } from '@mui/icons-material';
import LaunchIcon from '@mui/icons-material/Launch';
import { Collapse, Divider, FormLabel, IconButton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { useGetReward, useGetRewardPermissions } from 'charmClient/hooks/rewards';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { CharmEditor } from 'components/common/CharmEditor';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { ScrollableWindow } from 'components/common/PageLayout';
import UserDisplay from 'components/common/UserDisplay';
import { RewardProperties } from 'components/rewards/components/RewardProperties/RewardProperties';
import type { WorkInput } from 'components/rewards/hooks/useApplication';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';
import { useNewWork } from 'components/rewards/hooks/useNewApplication';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePage } from 'hooks/usePage';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { ApplicationComments } from './ApplicationComments';
import ApplicationInput from './RewardApplicationInput';
import { RewardReviewerActions } from './RewardReviewerActions';
import { RewardSubmissionInput } from './RewardSubmissionInput';

type Props = {
  applicationId: string | null;
  rewardId?: string | null;
};

export function RewardApplicationPageComponent({ applicationId, rewardId }: Props) {
  const isNewApplication = !applicationId && !!rewardId;

  const { application, refreshApplication, applicationRewardPermissions, updateApplication, reviewApplication } =
    useApplication({
      applicationId: applicationId || ''
    });

  const router = useRouter();
  const { data: reward, mutate: refreshReward } = useGetReward({ rewardId: application?.bountyId || rewardId || '' });
  const currentRewardId = rewardId || reward?.id;

  const { hideApplication, openedFromModal, showApplication } = useApplicationDialog();
  const { page: rewardPageContent } = usePage({ pageIdOrPath: currentRewardId });

  const { space } = useCurrentSpace();

  const { permissions: rewardPagePermissions } = usePagePermissions({ pageIdOrPath: currentRewardId as string });
  const { data: rewardPermissions } = useGetRewardPermissions({ rewardId: currentRewardId });

  const { members } = useMembers();
  const { user } = useUser();
  const { showMessage } = useSnackbar();

  const [showProperties, setShowProperties] = useState(false);
  const { showPage: showReward, hidePage: hideReward } = usePageDialog();
  const { createNewWork } = useNewWork(currentRewardId);

  const saveApplication = async (input: WorkInput) => {
    if (isNewApplication) {
      const newApplication = await createNewWork(input);
      refreshReward();
      if (newApplication) {
        showApplication(newApplication?.id);
      }
    } else {
      updateApplication(input);
    }
  };

  if ((!application && !isNewApplication) || !reward) {
    return null;
  }

  function onClose() {
    setUrlWithoutRerender(router.pathname, { id: null });
    hideReward();
  }

  function goToReward() {
    if (space && rewardPageContent) {
      hideApplication();

      if (openedFromModal && currentRewardId) {
        router.push({ pathname: `/${space.domain}/rewards`, query: { id: currentRewardId } });
        showReward({
          pageId: currentRewardId,
          onClose
        });
      } else {
        router.push(`/${space.domain}/${rewardPageContent.path}`);
      }
    }
  }

  const submitter = members.find((m) => m.id === application?.createdBy);

  const readonlySubmission =
    application &&
    (user?.id !== application?.createdBy ||
      (['complete', 'paid', 'processing', 'rejected'] as ApplicationStatus[]).includes(application.status));

  const showApplicationInput =
    (reward.approveSubmitters && !!application && application.status === 'applied') ||
    (isNewApplication && reward.approveSubmitters);

  const showSubmissionInput =
    (reward.approveSubmitters && !!application && application.status === 'applied') ||
    (isNewApplication && !reward.approveSubmitters);

  return (
    <ScrollableWindow>
      {/** TODO - Use more elegant layout */}
      <Grid container px='10%' gap={2}>
        <Grid item xs={12} display='flex' flexDirection='column' justifyContent='space-between' sx={{ mb: 1 }}>
          <PageTitleInput value={reward.page.title} readOnly onChange={() => null} />
          {space && rewardPageContent && (
            <Box onClick={goToReward} sx={{ cursor: 'pointer' }}>
              <Typography variant='body2' display='flex' gap={1} color='secondary'>
                <LaunchIcon fontSize='small' sx={{ transform: 'rotate(270deg)' }} />
                <span>Back to reward</span>
              </Typography>
            </Box>
          )}
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
                readOnly={!rewardPagePermissions?.edit_content}
                rewardChanged={refreshReward}
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

        {!!application && (
          <Grid
            item
            container
            xs={12}
            gap={2}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Grid item display='flex' alignItems='center' gap={2}>
              <FormLabel sx={{ fontWeight: 'bold', cursor: 'pointer', lineHeight: '1.5' }}>
                {application?.status === 'rejected' || application?.status === 'applied' ? 'Applicant' : 'Submitter'}
              </FormLabel>
              <UserDisplay user={submitter} avatarSize='small' showMiniProfile />
            </Grid>

            <Grid item>
              <RewardReviewerActions
                application={application}
                reward={reward}
                rewardPermissions={rewardPermissions}
                refreshApplication={refreshApplication}
                reviewApplication={reviewApplication}
                hasCustomReward={!!reward.customReward}
              />
            </Grid>
          </Grid>
        )}

        {showApplicationInput && (
          <Grid item xs={12}>
            <ApplicationInput
              application={application}
              rewardId={reward.id}
              expandedOnLoad
              readOnly={application?.createdBy !== user?.id && !isNewApplication}
              onSubmit={(updatedApplication) =>
                saveApplication({
                  applicationId: application?.id,
                  message: updatedApplication,
                  rewardId: reward.id
                })
              }
            />
          </Grid>
        )}

        {showSubmissionInput && currentRewardId && (
          <Grid item xs={12}>
            <RewardSubmissionInput
              currentUserIsApplicant={(!!user && user?.id === application?.createdBy) || isNewApplication}
              submission={application}
              readOnly={readonlySubmission}
              expandedOnLoad
              refreshSubmission={refreshApplication}
              onSubmit={(submission) =>
                saveApplication({
                  rewardId: reward.id,
                  submissionNodes: submission.submissionNodes,
                  applicationId: application?.id
                })
              }
              bountyId={currentRewardId}
              permissions={applicationRewardPermissions}
              hasCustomReward={!!reward.customReward}
            />
          </Grid>
        )}
        {application && (
          <Grid item xs={12}>
            <ApplicationComments applicationId={application.id} status={application.status} />
          </Grid>
        )}
      </Grid>
    </ScrollableWindow>
  );
}
