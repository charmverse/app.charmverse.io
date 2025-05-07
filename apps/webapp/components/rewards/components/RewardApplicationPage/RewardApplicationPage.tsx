import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { ArrowBack } from '@mui/icons-material';
import { Box, Divider, FormLabel, Grid, Tab, Tabs } from '@mui/material';
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
import { useMdScreen } from 'hooks/useMediaScreens';
import { useMembers } from 'hooks/useMembers';
import { usePage } from 'hooks/usePage';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { UpdateableRewardFields } from '@packages/lib/rewards/updateRewardSettings';

import { RewardEvaluations } from '../RewardEvaluations/RewardEvaluations';

import { ApplicationComments } from './components/ApplicationComments';
import { ApplicationInput } from './components/RewardApplicationInput';
import { RewardSubmissionInput } from './components/RewardSubmissionInput';

type Props = {
  applicationId: string | null;
  rewardId?: string | null;
};

const StyledContainer = styled(PageEditorContainer)`
  margin-bottom: 180px;
`;

export function RewardApplicationPage({ applicationId: _applicationId, rewardId }: Props) {
  const applicationId = _applicationId === 'new' ? null : _applicationId;
  const isNewApplication = !applicationId && !!rewardId;
  const { showMessage } = useSnackbar();
  const { navigateToSpacePath } = useCharmRouter();
  const { application, refreshApplication, applicationRewardPermissions, updateApplication } = useApplication({
    applicationId: applicationId || ''
  });

  const { data: reward, mutate: refreshReward } = useGetReward({ rewardId: application?.bountyId || rewardId || '' });
  const currentRewardId = rewardId || reward?.id || application?.bountyId;
  const { page } = usePage({ pageIdOrPath: reward?.page.id });
  const [currentTab, setCurrentTab] = useState<number>(0);
  const isMdScreen = useMdScreen();

  const { data: rewardPageContent } = useGetPage(currentRewardId);

  const { members } = useMembers();
  const { user } = useUser();

  const { createNewWork } = useNewWork(currentRewardId);
  const [isSaving, setIsSaving] = useState(false);
  const { activeView: sidebarView, setActiveView } = usePageSidebar();
  const [defaultSidebarView, setDefaultView] = useState<PageSidebarView | null>('reward_evaluation');
  const internalSidebarView = defaultSidebarView || sidebarView;

  useEffect(() => {
    setActiveView(defaultSidebarView);
    setDefaultView(null);
    return () => {
      // clear sidebar so we
      setActiveView(null);
    };
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
        const submission = await createNewWork(input);
        refreshReward();
        if (submission) {
          navigateToSpacePath(`/rewards/applications/${submission.id}`);
        }
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
    if (!isNewApplication) {
      navigateToSpacePath(`/${currentRewardId}`);
    }
  }

  function onCancelNewSubmission() {
    if (!currentRewardId || !isNewApplication) {
      return;
    }

    navigateToSpacePath(`/${currentRewardId}`);
  }

  if (!reward) {
    return null;
  }

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
          <Box mt={6} display='flex' flexDirection='column' height='100%'>
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
                    {!isNewApplication && (
                      <Button
                        onClick={goToReward}
                        color='secondary'
                        variant='text'
                        startIcon={<ArrowBack fontSize='small' />}
                      >
                        <span>Back</span>
                      </Button>
                    )}

                    {!isMdScreen && (
                      <Tabs
                        sx={{
                          mb: 1
                        }}
                        indicatorColor='primary'
                        value={currentTab}
                      >
                        <Tab label='Document' value={0} onClick={() => setCurrentTab(0)} />
                        <Tab
                          sx={{
                            px: 1.5,
                            fontSize: 14,
                            minHeight: 0
                          }}
                          label='Evaluation'
                          value={1}
                          onClick={() => setCurrentTab(1)}
                        />
                      </Tabs>
                    )}

                    {currentTab === 0 && (
                      <>
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
                                onCancel={application ? undefined : onCancelNewSubmission}
                                application={application}
                                disableCollapse={!showSubmissionInput}
                                expandedOnLoad={isNewApplication || isApplicationStage}
                                readOnly={
                                  (application?.createdBy !== user?.id && !isNewApplication) || !isApplicationStage
                                }
                                onSubmit={(updatedApplication) =>
                                  saveApplication(
                                    {
                                      applicationId: application?.id,
                                      message: updatedApplication.message,
                                      messageNodes: updatedApplication.messageNodes,
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
                                onCancel={application ? undefined : onCancelNewSubmission}
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
                                rewardType={reward.rewardType}
                                isSaving={isSaving}
                              />
                            )}
                            {application && <ApplicationComments applicationId={application.id} />}
                          </>
                        )}
                      </>
                    )}
                    {currentTab === 1 && (
                      <RewardEvaluations
                        isNewApplication={isNewApplication}
                        page={page}
                        readOnly={!page?.permissionFlags?.edit_content}
                        application={application}
                        reward={reward}
                        templateId={page?.sourceTemplateId}
                        refreshApplication={refreshApplication}
                        onChangeReward={updateReward}
                        refreshReward={refreshReward}
                      />
                    )}
                  </Box>
                </StyledContainer>
              </Box>
            </Box>
          </Box>
        </DocumentColumn>
        <RewardSidebar
          isNewApplication={isNewApplication}
          sidebarProps={{
            isOpen: internalSidebarView === 'reward_evaluation',
            closeSidebar: () => setActiveView(null),
            openSidebar: () => setActiveView('reward_evaluation')
          }}
          page={page}
          templateId={page?.sourceTemplateId}
          readOnly={!page?.permissionFlags?.edit_content}
          application={application}
          reward={reward}
          refreshApplication={refreshApplication}
          onChangeReward={updateReward}
          refreshReward={refreshReward}
        />
      </DocumentColumnLayout>
    </Box>
  );
}
