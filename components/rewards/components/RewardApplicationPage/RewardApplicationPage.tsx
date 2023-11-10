import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { ArrowBack } from '@mui/icons-material';
import { Box, Grid, Divider, FormLabel, Stack } from '@mui/material';
import { useState } from 'react';

import { useGetReward, useGetRewardPermissions } from 'charmClient/hooks/rewards';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import UserDisplay from 'components/common/UserDisplay';
import { RewardProperties } from 'components/rewards/components/RewardProperties/RewardProperties';
import type { WorkInput } from 'components/rewards/hooks/useApplication';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';
import { useNewWork } from 'components/rewards/hooks/useNewApplication';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePage } from 'hooks/usePage';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import { ApplicationComments } from './components/ApplicationComments';
import { ApplicationInput } from './components/RewardApplicationInput';
import { RewardReviewerActions } from './components/RewardReviewerActions';
import { RewardSubmissionInput } from './components/RewardSubmissionInput';

type Props = {
  applicationId: string | null;
  rewardId?: string | null;
  closeDialog?: VoidFunction;
};

const StyledContainer = styled(Container)`
  margin-bottom: 180px;
`;

export function RewardApplicationPage({ applicationId, rewardId, closeDialog }: Props) {
  const isNewApplication = !applicationId && !!rewardId;
  const { showMessage } = useSnackbar();

  const { application, refreshApplication, applicationRewardPermissions, updateApplication, reviewApplication } =
    useApplication({
      applicationId: applicationId || ''
    });

  const { navigateToSpacePath, router } = useCharmRouter();
  const { data: reward, mutate: refreshReward } = useGetReward({ rewardId: application?.bountyId || rewardId || '' });
  const currentRewardId = rewardId || reward?.id;

  const { hideApplication, openedFromModal, showApplication } = useApplicationDialog();
  const { page: rewardPageContent } = usePage({ pageIdOrPath: currentRewardId });

  const { space } = useCurrentSpace();

  const { data: rewardPermissions } = useGetRewardPermissions({ rewardId: currentRewardId });

  const { members } = useMembers();
  const { user } = useUser();

  const { showPage: showReward, hidePage: hideReward } = usePageDialog();
  const { createNewWork } = useNewWork(currentRewardId);
  const [isSaving, setIsSaving] = useState(false);

  const saveApplication = async (input: WorkInput, type?: 'application' | 'submission') => {
    try {
      setIsSaving(true);
      if (isNewApplication) {
        await createNewWork(input);
        refreshReward();
        closeDialog?.();
      } else {
        await updateApplication(input);
      }

      const messageType = type === 'application' ? 'Application' : 'Submission';
      showMessage(`${messageType} saved successfully`, 'success');

      return true;
    } catch (error) {
      showMessage((error as Error).message, 'error');

      return false;
    } finally {
      setIsSaving(false);
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
        navigateToSpacePath(`/rewards`, { id: currentRewardId });
        showReward({
          pageId: currentRewardId,
          onClose
        });
      } else {
        navigateToSpacePath(`/${rewardPageContent.path}`);
      }
    }
  }

  const submitter = members.find((m) => m.id === application?.createdBy);

  const readonlySubmission =
    application &&
    (user?.id !== application?.createdBy ||
      (['complete', 'paid', 'processing', 'rejected'] as ApplicationStatus[]).includes(application.status));

  const applicationStepRequired = reward.approveSubmitters;

  const showSubmissionInput = !applicationStepRequired || (application && application.status !== 'applied');

  const isApplicationInReview = application?.status === 'applied';

  return (
    <div className='document-print-container'>
      <Box display='flex' flexDirection='column'>
        <StyledContainer top={0}>
          <PageTitleInput value={reward.page.title} readOnly onChange={() => null} />
          {space && rewardPageContent && (
            <Button onClick={goToReward} color='secondary' variant='text' startIcon={<ArrowBack fontSize='small' />}>
              <span>Back to reward</span>
            </Button>
          )}

          <div className='focalboard-body'>
            <RewardProperties
              rewardId={reward.id}
              pageId={reward.page.id}
              pagePath={reward.page.path}
              readOnly
              rewardChanged={refreshReward}
            />
            {rewardPageContent?.content && (
              <>
                <CharmEditor readOnly content={rewardPageContent.content as PageContent} isContentControlled />
                <Divider sx={{ mt: 2 }} />
              </>
            )}
          </div>

          {!!application && application?.createdBy !== user?.id && (
            <Grid container gap={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

          {applicationStepRequired && (
            <ApplicationInput
              application={application}
              rewardId={reward.id}
              disableCollapse={!showSubmissionInput}
              expandedOnLoad={isNewApplication || isApplicationInReview}
              readOnly={application?.createdBy !== user?.id && !isNewApplication}
              onSubmit={(updatedApplication) =>
                saveApplication(
                  {
                    applicationId: application?.id,
                    message: updatedApplication,
                    rewardId: reward.id
                  },
                  'application'
                )
              }
              isSaving={isSaving}
            />
          )}

          {showSubmissionInput && (
            <RewardSubmissionInput
              currentUserIsApplicant={(!!user && user?.id === application?.createdBy) || isNewApplication}
              submission={application}
              readOnly={readonlySubmission}
              refreshSubmission={refreshApplication}
              onSubmit={(submission) =>
                saveApplication(
                  {
                    rewardId: reward.id,
                    submissionNodes: submission.submissionNodes,
                    applicationId: application?.id
                  },
                  'submission'
                )
              }
              bountyId={currentRewardId}
              permissions={applicationRewardPermissions}
              hasCustomReward={!!reward.customReward}
              isSaving={isSaving}
            />
          )}
          {application && <ApplicationComments applicationId={application.id} status={application.status} />}
        </StyledContainer>
      </Box>
    </div>
  );
}
