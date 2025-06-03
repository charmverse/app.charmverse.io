import type { Prisma } from '@charmverse/core/prisma-client';
import type { Theme } from '@mui/material';
import { styled, Box, Divider, Tab, Tabs, useMediaQuery } from '@mui/material';
import type { ICharmEditorOutput } from '@packages/bangleeditor/specRegistry';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type {
  RewardFields,
  RewardPropertiesField,
  RewardPropertyValues
} from '@packages/lib/rewards/blocks/interfaces';
import type { RewardPageProps } from '@packages/lib/rewards/createReward';
import { getRewardErrors } from '@packages/lib/rewards/getRewardErrors';
import type { RewardTemplate } from '@packages/lib/rewards/getRewardTemplate';
import type { RewardWorkflow } from '@packages/lib/rewards/getRewardWorkflows';
import { inferRewardWorkflow } from '@packages/lib/rewards/inferRewardWorkflow';
import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';

import { useGetRewardTemplate, useGetRewardTemplatesBySpace, useGetRewardWorkflows } from 'charmClient/hooks/rewards';
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
import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMdScreen } from 'hooks/useMediaScreens';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import { fontClassName } from 'theme/fonts';

import { RewardEvaluations } from './components/RewardEvaluations/RewardEvaluations';
import { CustomPropertiesAdapter } from './components/RewardProperties/CustomPropertiesAdapter';
import { TemplateSelect } from './components/TemplateSelect';
import type { UpdateableRewardFieldsWithType } from './hooks/useNewReward';
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
  const { showConfirmation } = useConfirmationModal();
  const spacePermissions = useCurrentSpacePermissions();
  const { navigateToSpacePath } = useCharmRouter();
  const { space: currentSpace } = useCurrentSpace();
  const { activeView: sidebarView, setActiveView } = usePageSidebar();
  const [rewardTemplateId, setRewardTemplateId] = useState<null | undefined | string>(templateIdFromUrl);
  const [, setPageTitle] = usePageTitle();
  const { data: sourceTemplate } = useGetRewardTemplate(rewardTemplateId);
  const { data: rewardTemplates } = useGetRewardTemplatesBySpace(currentSpace?.id);
  const { data: workflowOptions, isLoading: isLoadingWorkflows } = useGetRewardWorkflows(currentSpace?.id);
  const { contentUpdated, createReward, rewardValues, setRewardValues, isSavingReward } = useNewReward();
  const [submittedDraft, setSubmittedDraft] = useState<boolean>(false);
  const containerWidthRef = useRef<HTMLDivElement>(undefined);
  const { width: containerWidth = 0 } = useResizeObserver({ ref: containerWidthRef as RefObject<HTMLElement> });
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  const [pageData, setPageData] = useState<RewardPageProps>({
    title: '',
    content: null,
    contentText: ''
  });
  const canCreateReward = !spacePermissions || !!spacePermissions[0]?.createBounty;
  const isAdmin = useIsAdmin();
  const rewardPageType = isTemplate ? 'bounty_template' : 'bounty';
  const [currentTab, setCurrentTab] = useState<number>(0);
  const isMdScreen = useMdScreen();

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
    setRewardTemplateId(template.page.id);
    setPageData({
      content: template.page.content as PageContent,
      contentText: template.page.contentText,
      title: pageData.title,
      sourceTemplateId: template.page.id
    });
    setRewardValues({
      assignedSubmitters: template.assignedSubmitters,
      allowedSubmitterRoles: template.allowedSubmitterRoles,
      allowMultipleApplications: template.allowMultipleApplications,
      approveSubmitters: template.approveSubmitters,
      chainId: template.chainId,
      customReward: template.customReward,
      dueDate: template.dueDate,
      maxSubmissions: template.maxSubmissions,
      reviewers: template.reviewers,
      rewardAmount: template.rewardAmount,
      rewardToken: template.rewardToken,
      rewardType: template.rewardType,
      selectedCredentialTemplates: template.selectedCredentialTemplates,
      fields: template.fields
    });
    const workflow =
      workflowOptions && template.fields && inferRewardWorkflow(workflowOptions, template.fields as RewardFields);
    if (workflow) {
      applyWorkflow(workflow, template.assignedSubmitters, template.fields);
    }
  }

  function applyWorkflow(workflow: RewardWorkflow, assignedSubmitters?: string[] | null, fields?: Prisma.JsonValue) {
    const updatedFields = {
      ...(rewardValues.fields as object | undefined | null),
      ...(fields as object | undefined | null),
      workflowId: workflow.id
    };

    if (workflow.id === 'application_required') {
      setRewardValues({
        approveSubmitters: true,
        assignedSubmitters: null,
        fields: updatedFields
      });
    } else if (workflow.id === 'direct_submission') {
      setRewardValues({
        approveSubmitters: false,
        assignedSubmitters: null,
        fields: updatedFields
      });
    } else if (workflow.id === 'assigned' || workflow.id === 'assigned_kyc') {
      setRewardValues({
        approveSubmitters: false,
        allowMultipleApplications: false,
        assignedSubmitters: assignedSubmitters ?? rewardValues.assignedSubmitters ?? [],
        allowedSubmitterRoles: [],
        fields: updatedFields
      });
    }
  }

  const saveForm = async (isDraft?: boolean) => {
    setSubmittedDraft(!!isDraft);
    const createdReward = await createReward({
      ...pageData,
      type: rewardPageType,
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
    return () => {
      // clear sidebar so we
      setActiveView(null);
    };
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
    } else {
      setPageData({
        sourceTemplateId: null
      });
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
                                        showConfirmation({
                                          message:
                                            'Are you sure you want to overwrite your current content with the template?',
                                          title: 'Overwriting your content',
                                          confirmButton: 'Overwrite',
                                          onConfirm: () => {
                                            setRewardTemplateId(page.id);
                                          }
                                        });
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
                                fields: {
                                  ...((rewardValues.fields as RewardFields) ?? {}),
                                  properties: properties ? { ...properties } : {}
                                } as Prisma.JsonValue
                              });
                            }}
                          />
                        </div>
                      </div>
                      <CharmEditor
                        placeholderText={`Type '/' to see the list of available commands`}
                        content={pageData.content as PageContent}
                        autoFocus={false}
                        enableVoting={false}
                        containerWidth={containerWidth}
                        pageType={rewardPageType}
                        disableNestedPages
                        onContentChange={applyRewardContent}
                        focusOnInit
                        isContentControlled
                        key={pageData.sourceTemplateId}
                      />
                    </>
                  )}
                  {currentTab === 1 && (
                    <RewardEvaluations
                      onChangeWorkflow={applyWorkflow}
                      templateId={pageData.sourceTemplateId}
                      isTemplate={!!isTemplate}
                      isUnpublishedReward
                      rewardInput={rewardValues}
                      onChangeReward={(updates) => {
                        setRewardValues(updates);
                      }}
                    />
                  )}
                </Box>
              </StyledContainer>
            </Box>
            <StickyFooterContainer>
              <Button
                disabled={isSavingReward}
                loading={isSavingReward && submittedDraft}
                data-test='draft-reward-button'
                variant='outlined'
                onClick={() => saveForm(true)}
              >
                Save draft
              </Button>
              <Button
                data-test='publish-reward-button'
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
          isTemplate={!!isTemplate}
          templateId={pageData.sourceTemplateId}
          isUnpublishedReward
          rewardInput={rewardValues}
          onChangeReward={setRewardValues}
        />
      </DocumentColumnLayout>
    </Box>
  );
}
