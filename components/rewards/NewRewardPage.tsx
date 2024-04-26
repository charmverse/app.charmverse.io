import type { Prisma } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, Divider, useMediaQuery } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';

import { useGetRewardWorkflows } from 'charmClient/hooks/rewards';
import { DocumentColumn, DocumentColumnLayout } from 'components/[pageId]/DocumentPage/components/DocumentColumnLayout';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { RewardSidebar } from 'components/[pageId]/DocumentPage/components/Sidebar/RewardSidebar';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { defaultPageTop } from 'components/[pageId]/DocumentPage/DocumentPage';
import type { PageSidebarView } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { usePageSidebar } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import { focusEventName } from 'components/common/CharmEditor/constants';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/specRegistry';
import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { TemplateSelect } from 'components/proposals/ProposalPage/components/TemplateSelect';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { RewardFields, RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import { getRewardErrors } from 'lib/rewards/getRewardErrors';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { RewardWorkflow } from 'lib/rewards/getRewardWorkflows';
import { inferRewardWorkflow } from 'lib/rewards/inferRewardWorkflow';
import { fontClassName } from 'theme/fonts';

import { CustomPropertiesAdapter } from './components/RewardProperties/CustomPropertiesAdapter';
import { useNewReward } from './hooks/useNewReward';

const StyledContainer = styled(PageEditorContainer)`
  margin-bottom: 180px;
`;
// Note: this component is only used before a page is saved to the DB
export function NewRewardPage({
  isTemplate,
  templateId: templateIdFromUrl
}: {
  isTemplate?: boolean;
  templateId?: string;
}) {
  const { user } = useUser();
  const spacePermissions = useCurrentSpacePermissions();
  const { navigateToSpacePath } = useCharmRouter();
  const { space: currentSpace } = useCurrentSpace();
  const { activeView: sidebarView, setActiveView } = usePageSidebar();
  const { templates: rewardTemplates } = useRewardTemplates();
  const [selectedRewardTemplateId, setSelectedRewardTemplateId] = useState<null | string>();
  const [rewardTemplateId, setRewardTemplateId] = useState<null | string>();
  const [, setPageTitle] = usePageTitle();
  const { data: workflowOptions, isLoading: isLoadingWorkflows } = useGetRewardWorkflows(currentSpace?.id);
  const { contentUpdated, createReward, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const sourceTemplate = rewardTemplates?.find((template) => template.page.id === rewardTemplateId);
  const [submittedDraft, setSubmittedDraft] = useState<boolean>(false);
  const containerWidthRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth = 0 } = useResizeObserver({ ref: containerWidthRef });
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const [pageData, setPageData] = useState<{
    title: string;
    content: PageContent | null;
    contentText: string;
  }>({
    title: '',
    content: null,
    contentText: ''
  });
  const canCreateReward = !spacePermissions || !!spacePermissions[0]?.createBounty;
  const isAdmin = useIsAdmin();
  const rewardPageType = isTemplate ? 'bounty_template' : 'bounty';

  const disabledTooltip = useMemo(() => {
    const errors = getRewardErrors({
      page: { title: pageData.title, type: rewardPageType },
      reward: rewardValues,
      rewardType: rewardValues.rewardType
    });
    if (!canCreateReward) {
      errors.push('You do not have permission to create reward');
    }

    return errors.join('\n');
  }, [rewardValues, canCreateReward, rewardPageType, pageData.title]);

  usePreventReload(contentUpdated);
  const templatePageOptions = (rewardTemplates || []).map((template) => ({
    id: template.page.id,
    title: template.page.title
  }));

  function focusDocumentEditor() {
    const focusEvent = new CustomEvent(focusEventName);
    document.querySelector(`.bangle-editor-core`)?.dispatchEvent(focusEvent);
  }

  function applyRewardContent({ doc, rawText }: ICharmEditorOutput) {
    setPageData((_pageData) => ({
      ..._pageData,
      content: doc,
      contentText: rawText
    }));
  }

  function applyTemplate(template: RewardTemplate) {
    setPageData({
      content: template.page.content as PageContent,
      contentText: template.page.contentText,
      title: pageData.title
    });
    const rewardType = getRewardType(template.reward);
    setRewardValues({
      assignedSubmitters: template.reward.assignedSubmitters,
      allowedSubmitterRoles: template.reward.allowedSubmitterRoles,
      allowMultipleApplications: template.reward.allowMultipleApplications,
      approveSubmitters: template.reward.approveSubmitters,
      chainId: template.reward.chainId,
      customReward: template.reward.customReward,
      dueDate: template.reward.dueDate,
      maxSubmissions: template.reward.maxSubmissions,
      reviewers: template.reward.reviewers,
      rewardAmount: template.reward.rewardAmount,
      rewardToken: template.reward.rewardToken,
      rewardType,
      selectedCredentialTemplates: template.reward.selectedCredentialTemplates,
      fields: template.reward.fields
    });
    setRewardTemplateId(template.page.id);
    const workflow = inferRewardWorkflow(workflowOptions ?? [], template.reward);
    if (workflow) {
      applyWorkflow(workflow);
    }
  }

  function applyWorkflow(workflow: RewardWorkflow) {
    if (workflow.id === 'application_required') {
      setRewardValues({
        approveSubmitters: true,
        assignedSubmitters: null
      });
    } else if (workflow.id === 'direct_submission') {
      setRewardValues({
        approveSubmitters: false,
        assignedSubmitters: null
      });
    } else if (workflow.id === 'assigned') {
      setRewardValues({
        approveSubmitters: false,
        allowMultipleApplications: false,
        assignedSubmitters: [user!.id]
      });
    }
  }

  const saveForm = async (isDraft?: boolean) => {
    setSubmittedDraft(!!isDraft);
    const createdReward = await createReward({
      content: pageData.content,
      contentText: pageData.contentText,
      title: pageData.title,
      type: rewardPageType,
      sourceTemplateId: sourceTemplate?.page.id,
      isDraft
    });

    if (createdReward) {
      navigateToSpacePath(`/${createdReward.id}`);
    }
  };

  const [defaultSidebarView, setDefaultView] = useState<PageSidebarView | null>('reward_evaluation');
  const internalSidebarView = defaultSidebarView || sidebarView;

  useEffect(() => {
    // clear out page title on load
    setPageTitle('');
    setActiveView('reward_evaluation');
    setDefaultView(null);
  }, []);

  useEffect(() => {
    if (!isLoadingWorkflows) {
      if (templateIdFromUrl) {
        setRewardTemplateId(templateIdFromUrl);
      } else if (workflowOptions?.length) {
        applyWorkflow(workflowOptions[0]);
      }
    }
  }, [templateIdFromUrl, isLoadingWorkflows]);

  useEffect(() => {
    if (sourceTemplate) {
      applyTemplate(sourceTemplate);
    }
  }, [sourceTemplate]);

  return (
    <Box display='flex' flexGrow={1} minHeight={0} /** add minHeight so that flexGrow expands to correct heigh */>
      <DocumentColumnLayout>
        <DocumentColumn>
          <Box display='flex' flexDirection='column' height='100%'>
            <Box
              className={`document-print-container ${fontClassName}`}
              display='flex'
              flexDirection='column'
              overflow='auto'
              flexGrow={1}
            >
              <Box ref={containerWidthRef} width='100%' />
              <PageTemplateBanner
                pageType={rewardPageType}
                isNewPage
                customTitle={canCreateReward ? undefined : 'Creating new reward is disabled'}
              />
              <StyledContainer data-test='page-charmeditor' top={defaultPageTop} fullWidth={isSmallScreen}>
                <Box minHeight={450}>
                  <PageTitleInput
                    updatedAt={new Date().toString()}
                    value={pageData.title || ''}
                    onChange={(updatedPage) => {
                      const title = updatedPage.title || '';
                      setPageData({
                        ...pageData,
                        title
                      });
                      setPageTitle(title);
                    }}
                    focusDocumentEditor={focusDocumentEditor}
                    placeholder='Title (required)'
                  />
                  <div className='focalboard-body font-family-default'>
                    <div className='CardDetail content'>
                      {!isTemplate && (
                        <>
                          <Box className='octo-propertyrow'>
                            <PropertyLabel readOnly highlighted>
                              Template
                            </PropertyLabel>
                            <Box display='flex' flex={1}>
                              <TemplateSelect
                                options={templatePageOptions}
                                value={rewardTemplateId}
                                onChange={(page) => {
                                  if (page === null) {
                                    setRewardTemplateId(null);
                                    // if user has not updated the content, then just overwrite everything
                                  } else if (pageData.contentText?.length === 0) {
                                    setRewardTemplateId(page.id);
                                  } else {
                                    setSelectedRewardTemplateId(page.id);
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                          <Divider />
                        </>
                      )}
                      <CustomPropertiesAdapter
                        reward={{
                          fields: rewardValues.fields as RewardFields
                        }}
                        onChange={(properties: RewardPropertiesField) => {
                          setRewardValues({
                            fields: { properties: properties ? { ...properties } : {} } as Prisma.JsonValue
                          });
                        }}
                      />
                    </div>
                  </div>
                  <CharmEditor
                    placeholderText={`Describe the reward. Type '/' to see the list of available commands`}
                    content={pageData.content as PageContent}
                    autoFocus={false}
                    enableVoting={false}
                    containerWidth={containerWidth}
                    pageType={rewardPageType}
                    disableNestedPages
                    onContentChange={applyRewardContent}
                    focusOnInit
                    isContentControlled
                    key={rewardTemplateId}
                  />
                </Box>
              </StyledContainer>
            </Box>
            <StickyFooterContainer>
              <Button
                disabled={isSavingReward}
                loading={isSavingReward && submittedDraft}
                data-test='create-proposal-button'
                variant='outlined'
                onClick={() => saveForm(true)}
              >
                Save draft
              </Button>
              <Button
                data-test='publish-new-reward-button'
                disabled={Boolean(disabledTooltip) || isSavingReward}
                disabledTooltip={disabledTooltip}
                onClick={() => saveForm()}
                loading={isSavingReward && !submittedDraft}
              >
                Publish
              </Button>
            </StickyFooterContainer>
          </Box>
        </DocumentColumn>
        <RewardSidebar
          onChangeWorkflow={applyWorkflow}
          sidebarProps={{
            isOpen: internalSidebarView === 'reward_evaluation',
            closeSidebar: () => setActiveView(null),
            openSidebar: () => setActiveView('reward_evaluation')
          }}
          // if creating a reward from template then disable the reward properties
          readOnly={!isAdmin && !!rewardTemplateId && !isTemplate}
          isUnpublishedReward
          rewardInput={rewardValues}
          onChangeReward={(updates) => {
            setRewardValues(updates);
          }}
        />
        <ConfirmDeleteModal
          onClose={() => {
            setSelectedRewardTemplateId(null);
          }}
          open={!!selectedRewardTemplateId}
          title='Overwriting your content'
          buttonText='Overwrite'
          secondaryButtonText='Go back'
          question='Are you sure you want to overwrite your current content with the reward template content?'
          onConfirm={() => {
            setRewardTemplateId(selectedRewardTemplateId!);
            setSelectedRewardTemplateId(null);
          }}
        />
      </DocumentColumnLayout>
    </Box>
  );
}
