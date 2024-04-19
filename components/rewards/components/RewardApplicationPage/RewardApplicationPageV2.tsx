import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { ArrowBack } from '@mui/icons-material';
import { Box, Divider, FormLabel, Grid } from '@mui/material';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { useGetPage } from 'charmClient/hooks/pages';
import { useGetReward } from 'charmClient/hooks/rewards';
import { DocumentColumn, DocumentColumnLayout } from 'components/[pageId]/DocumentPage/components/DocumentColumnLayout';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { RewardProperties } from 'components/[pageId]/DocumentPage/components/RewardProperties';
import { RewardSidebar } from 'components/[pageId]/DocumentPage/components/Sidebar/RewardSidebar';
import type { PageSidebarView } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { usePageSidebar } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import UserDisplay from 'components/common/UserDisplay';
import type { WorkInput } from 'components/rewards/hooks/useApplication';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useNewWork } from 'components/rewards/hooks/useNewApplication';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePage } from 'hooks/usePage';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import { ApplicationComments } from './components/ApplicationComments';
import { ApplicationInput } from './components/RewardApplicationInput';
import { RewardSubmissionInput } from './components/RewardSubmissionInput';

type Props = {
  applicationId: string | null;
  rewardId?: string | null;
  closeDialog?: VoidFunction;
};

const StyledContainer = styled(PageEditorContainer)`
  margin-bottom: 180px;
`;

export function RewardApplicationPageV2({ applicationId, rewardId, closeDialog }: Props) {
  const isNewApplication = !applicationId && !!rewardId;
  const { showMessage } = useSnackbar();

  const { application, refreshApplication, applicationRewardPermissions, updateApplication } = useApplication({
    applicationId: applicationId || ''
  });

  const { data: reward, mutate: refreshReward } = useGetReward({ rewardId: application?.bountyId || rewardId || '' });
  const currentRewardId = rewardId || reward?.id;
  const { page } = usePage({ pageIdOrPath: reward?.page.id });

  const { data: rewardPageContent } = useGetPage(currentRewardId);

  const { space } = useCurrentSpace();

  const { members } = useMembers();
  const { user } = useUser();
  const {
    updateURLQuery,
    router: { query }
  } = useCharmRouter();

  const { createNewWork } = useNewWork(currentRewardId);
  const [isSaving, setIsSaving] = useState(false);
  const { activeView: sidebarView, setActiveView } = usePageSidebar();
  const [defaultSidebarView, setDefaultView] = useState<PageSidebarView | null>('reward_evaluation');
  const internalSidebarView = defaultSidebarView || sidebarView;

  useEffect(() => {
    setActiveView(defaultSidebarView);
    setDefaultView(null);
  }, []);

  async function updateReward(updateContent: UpdateableRewardFields) {
    if (application?.bountyId) {
      await charmClient.rewards.updateReward({
        rewardId: application.bountyId,
        updateContent
      });
      refreshReward();
    }
  }

  const saveApplication = async (input: WorkInput, type?: 'application' | 'submission') => {
    try {
      setIsSaving(true);
      if (isNewApplication) {
        await createNewWork(input);
        refreshReward();
        // use nav instead
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

  function goToReward() {
    if (space && rewardPageContent) {
      updateURLQuery({ applicationId: null });
    }
  }

  if (!reward) {
    return null;
  }

  const rewardType = getRewardType(reward);
  const submitter = members.find((m) => m.id === application?.createdBy);

  const readonlySubmission =
    application &&
    (user?.id !== application?.createdBy ||
      (['complete', 'paid', 'processing', 'rejected'] as ApplicationStatus[]).includes(application.status));

  const applicationStepRequired = reward.approveSubmitters;
  const isApplicationStage =
    applicationStepRequired &&
    (isNewApplication || application?.status === 'applied' || application?.status === 'rejected');
  const showSubmissionInput = (!applicationStepRequired && isNewApplication) || !isApplicationStage;
  const isApplicationLoaded = !!application || isNewApplication;

  return (
    <Box display='flex' flexGrow={1} minHeight={0} data-test='reward-application-page'>
      <DocumentColumnLayout>
        <DocumentColumn
          style={{
            overflow: 'hidden'
          }}
        >
          <Box mt={10} display='flex' flexDirection='column' height='100%'>
            <Box
              className='document-print-container'
              display='flex'
              flexDirection='column'
              overflow='auto'
              flexGrow={1}
            >
              <Box display='flex' flexDirection='column'>
                <StyledContainer top={0}>
                  <Box minHeight={450}>
                    <PageTitleInput
                      value={reward.page.title}
                      readOnly
                      onChange={() => null}
                      focusDocumentEditor={() => null}
                    />
                    {!!query.id && (
                      <Button
                        onClick={goToReward}
                        color='secondary'
                        variant='text'
                        startIcon={<ArrowBack fontSize='small' />}
                      >
                        <span>Back</span>
                      </Button>
                    )}

                    <div className='focalboard-body'>
                      <RewardProperties
                        reward={reward}
                        pageId={reward.page.id}
                        pagePath={reward.page.path}
                        readOnly
                        rewardChanged={refreshReward}
                      />
                      {rewardPageContent?.content && (
                        <>
                          <CharmEditor
                            readOnly
                            content={rewardPageContent.content as PageContent}
                            isContentControlled
                          />
                          <Divider sx={{ my: 2 }} />
                        </>
                      )}
                    </div>
                    {isApplicationLoaded && (
                      <>
                        {application && (
                          <Box mb={2} display='flex' justifyContent='space-between' alignItems='center'>
                            <Grid item display='flex' alignItems='center' gap={2}>
                              <FormLabel sx={{ fontWeight: 'bold', cursor: 'pointer', lineHeight: '1.5' }}>
                                {application.status === 'rejected' || application.status === 'applied'
                                  ? 'Applicant'
                                  : 'Submitter'}
                              </FormLabel>
                              <UserDisplay userId={submitter?.id} avatarSize='small' showMiniProfile />
                            </Grid>
                          </Box>
                        )}

                        {applicationStepRequired && (
                          <ApplicationInput
                            application={application}
                            rewardId={reward.id}
                            disableCollapse={!showSubmissionInput}
                            expandedOnLoad={isNewApplication || isApplicationStage}
                            readOnly={(application?.createdBy !== user?.id && !isNewApplication) || !isApplicationStage}
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
                            currentUserIsAuthor={(!!user && user.id === application?.createdBy) || isNewApplication}
                            submission={application}
                            readOnly={readonlySubmission}
                            refreshSubmission={refreshApplication}
                            onSubmit={(submission) =>
                              saveApplication(
                                {
                                  rewardId: reward.id,
                                  submissionNodes: submission.submissionNodes,
                                  applicationId: application?.id,
                                  submission: submission.submission,
                                  walletAddress: submission.walletAddress
                                },
                                'submission'
                              )
                            }
                            bountyId={currentRewardId}
                            permissions={applicationRewardPermissions}
                            rewardType={rewardType}
                            isSaving={isSaving}
                          />
                        )}
                        {application && <ApplicationComments applicationId={application.id} />}
                      </>
                    )}
                  </Box>
                </StyledContainer>
              </Box>
            </Box>
          </Box>
        </DocumentColumn>
        <RewardSidebar
          sidebarProps={{
            isOpen: internalSidebarView === 'reward_evaluation',
            closeSidebar: () => setActiveView(null),
            openSidebar: () => setActiveView('reward_evaluation')
          }}
          readOnly={!page?.permissionFlags?.edit_content}
          application={application}
          reward={reward}
          onChangeReward={updateReward}
        />
      </DocumentColumnLayout>
    </Box>
  );
}
