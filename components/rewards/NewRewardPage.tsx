import type { RewardEvaluationPermission } from '@charmverse/core/prisma';
import type { PageType } from '@charmverse/core/prisma-client';
import type { RewardWorkflowTyped } from '@charmverse/core/rewards';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, Divider, useMediaQuery } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { useResizeObserver } from 'usehooks-ts';
import { v4 as uuid } from 'uuid';

import { useForumPost } from 'charmClient/hooks/forum';
import { useGetPage } from 'charmClient/hooks/pages';
import { useGetRewardTemplate } from 'charmClient/hooks/rewards';
import { useGetRewardWorkflows } from 'charmClient/hooks/spaces';
import { DocumentColumn, DocumentColumnLayout } from 'components/[pageId]/DocumentPage/components/DocumentColumnLayout';
import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
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
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { focusEventName } from 'components/common/CharmEditor/constants';
import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { FormFieldAnswersControlled } from 'components/common/form/FormFieldAnswers';
import { ControlledFormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import { getInitialFormFieldValue } from 'components/common/form/hooks/useFormFields';
import type { FieldAnswerInput, FormFieldInput } from 'components/common/form/interfaces';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { authorSystemRole } from 'components/settings/rewards/components/EvaluationPermissions';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { RewardWithUsersAndRubric } from 'lib/rewards/interfaces';
import type { RubricCriteriaTyped } from 'lib/rewards/rubric/interfaces';
import { fontClassName } from 'theme/fonts';

import { getNewCriteria } from './components/RewardEvaluations/components/Settings/components/RubricCriteriaSettings';
import { RewardRewardsTable } from './components/RewardProperties/components/RewardRewards/RewardRewardsTable';
import type { RewardPropertiesInput } from './components/RewardProperties/RewardPropertiesBase';
import { RewardPropertiesBase } from './components/RewardProperties/RewardPropertiesBase';
import { TemplateSelect } from './components/TemplateSelect';
import { useNewReward } from './hooks/useNewReward';

export type RewardPageAndPropertiesInput = RewardPropertiesInput & {
  title?: string; // title is saved to the same state that's used in RewardPage
  content?: PageContent | null;
  contentText?: string;
  headerImage: string | null;
  icon: string | null;
  type: PageType;
  rewardType: 'structured' | 'free_form';
  formFields?: FormFieldInput[];
  formAnswers?: FieldAnswerInput[];
  formId?: string;
};

const StyledContainer = styled(PageEditorContainer)`
  margin-bottom: 180px;
`;
// Note: this component is only used before a page is saved to the DB
export function NewRewardPage({
  isTemplate,
  templateId: templateIdFromUrl,
  rewardType,
  sourcePageId,
  sourcePostId
}: {
  isTemplate?: boolean;
  templateId?: string;
  rewardType?: RewardPageAndPropertiesInput['rewardType'];
  sourcePageId?: string;
  sourcePostId?: string;
}) {
  const spacePermissions = useCurrentSpacePermissions();
  const { navigateToSpacePath } = useCharmRouter();
  const { space: currentSpace } = useCurrentSpace();
  const { data: sourcePage } = useGetPage(sourcePageId);
  const { data: sourcePost } = useForumPost(sourcePostId);
  const { user } = useUser();
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<string[]>([]);
  const { activeView: sidebarView, setActiveView } = usePageSidebar();
  const { templates: rewardTemplates } = useRewardTemplates();
  const [selectedRewardTemplateId, setSelectedRewardTemplateId] = useState<null | string>();
  const [contentTemplateId, setContentTemplateId] = useState<null | string>(); // used to keep charm editor content up-to-date
  const [, setPageTitle] = usePageTitle();
  const { data: workflowOptions, isLoading: isLoadingWorkflows } = useGetRewardWorkflows(currentSpace?.id);
  const rewardPageType = isTemplate ? 'reward_template' : 'reward';
  const { contentUpdated, createReward, rewardValues } = useNewReward();
  // const { data: sourceTemplate } = useGetRewardTemplate(formInputs.rewardTemplateId);
  const [submittedDraft, setSubmittedDraft] = useState<boolean>(false);

  const containerWidthRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth = 0 } = useResizeObserver({ ref: containerWidthRef });
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const isAdmin = useIsAdmin();

  const canCreateReward = !spacePermissions || !!spacePermissions[0]?.createBounty;

  // console.log('isValid', form.formState.isValid);
  // console.log('fieldConfig', projectField?.fieldConfig);

  let disabledTooltip = '';

  if (!canCreateReward) {
    disabledTooltip = 'You do not have permission to create reward';
  }

  function toggleCollapse(fieldId: string) {
    if (collapsedFieldIds.includes(fieldId)) {
      setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
    } else {
      setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
    }
  }
  usePreventReload(contentUpdated);

  // properties with values from templates should be read only
  const readOnlyCustomProperties = false;
  // TODO - Fix this
  // !isAdmin && sourceTemplate?.fields
  //   ? Object.entries(sourceTemplate?.fields?.properties || {})?.reduce((acc, [key, value]) => {
  //       if (!value) {
  //         return acc;
  //       }

  //       acc.push(key);
  //       return acc;
  //     }, [] as string[])
  //   : [];

  function focusDocumentEditor() {
    const focusEvent = new CustomEvent(focusEventName);
    // TODO: use a ref passed down instead
    document.querySelector(`.bangle-editor-core`)?.dispatchEvent(focusEvent);
  }

  // function setTemplateId(_templateId: string) {
  //   setFormInputs({
  //     rewardTemplateId: _templateId
  //   });
  // }
  // function applyTemplate(template: RewardWithUsersAndRubric) {
  //   const formFields = template.form?.formFields ?? [];
  //   const page = template.page!;
  //   setFormInputs(
  //     {
  //       authors,
  //       content: page.content as PageContent,
  //       contentText: page.contentText,
  //       selectedCredentialTemplates: template.selectedCredentialTemplates ?? [],
  //       headerImage: null,
  //       icon: null,
  //       evaluations: template.evaluations,
  //       fields:
  //         {
  //           ...template.fields,
  //           pendingRewards: template.fields?.pendingRewards?.map((pendingReward) => ({
  //             ...pendingReward,
  //             reward: {
  //               ...pendingReward.reward,
  //               assignedSubmitters: authors
  //             }
  //           }))
  //         } || {},
  //       type: rewardPageType,
  //       formId: template.formId ?? undefined,
  //       formFields: isTemplate ? formFields.map((formField) => ({ ...formField, id: uuid() })) : formFields,
  //       formAnswers: (template?.form?.formFields ?? [])
  //         .filter((formField) => formField.type !== 'label')
  //         .map((rewardFormField) => ({
  //           fieldId: rewardFormField.id,
  //           value: getInitialFormFieldValue(rewardFormField) as FieldAnswerInput['value']
  //         }))
  //     },
  //     { fromUser: false }
  //   );
  //   setContentTemplateId(template.id);
  //   const workflow = workflowOptions?.find((w) => w.id === template.workflowId);
  //   if (workflow) {
  //     // pass in the template since the formState will not be updated in this instance of applyWorkflow
  //     applyWorkflow(workflow, template);
  //   }
  // }

  // function clearTemplate() {
  //   setFormInputs({
  //     rewardTemplateId: null
  //   });
  // }

  // function applyWorkflow(workflow: RewardWorkflowTyped, template?: RewardWithUsersAndRubric) {
  //   setFormInputs(
  //     {
  //       workflowId: workflow.id,
  //       evaluations: workflow.evaluations.map((evaluation, index) => {
  //         // try to retain existing reviewers and configuration
  //         const existingStep = (template?.evaluations || formInputs.evaluations).find(
  //           (e) => e.title === evaluation.title
  //         );
  //         const rubricCriteria = (
  //           evaluation.type === 'rubric' ? existingStep?.rubricCriteria || [getNewCriteria()] : []
  //         ) as RubricCriteriaTyped[];
  //         // include author as default reviewer for feedback
  //         const defaultReviewers = evaluation.type === 'feedback' ? [{ systemRole: authorSystemRole.id }] : [];
  //         return {
  //           id: evaluation.id,
  //           index,
  //           reviewers: existingStep?.reviewers || defaultReviewers,
  //           rubricCriteria,
  //           title: evaluation.title,
  //           type: evaluation.type,
  //           result: null,
  //           voteSettings: existingStep?.voteSettings,
  //           permissions: evaluation.permissions as RewardEvaluationPermission[]
  //         };
  //       })
  //     },
  //     { fromUser: false }
  //   );
  // }

  // function applyRewardContent({ doc, rawText }: ICharmEditorOutput) {
  //   setFormInputs({
  //     content: doc,
  //     contentText: rawText
  //   });
  // }

  // async function saveForm({ isDraft }: { isDraft?: boolean } = {}) {
  //   setSubmittedDraft(!!isDraft);
  //   const result = await createReward();
  //   if (result) {
  //     navigateToSpacePath(`/${result.id}`);
  //   }
  // }

  // having `internalSidebarView` allows us to have the sidebar open by default, because usePageSidebar() does not allow us to do this currently
  const [defaultSidebarView, setDefaultView] = useState<PageSidebarView | null>('reward_evaluation');
  const internalSidebarView = defaultSidebarView || sidebarView;

  useEffect(() => {
    // clear out page title on load
    setPageTitle('');
    setActiveView('reward_evaluation');
    setDefaultView(null);
  }, []);

  // TODO - Add reward template
  // useEffect(() => {
  //   if (!isLoadingWorkflows) {
  //     // populate with template if selected
  //     if (templateIdFromUrl) {
  //       setTemplateId(templateIdFromUrl);
  //     }
  //     // populate workflow if not set and template is not selected
  //     else if (workflowOptions?.length) {
  //       applyWorkflow(workflowOptions[0]);
  //     }
  //   }
  // }, [templateIdFromUrl, isLoadingWorkflows]);

  const hasSource = !!sourcePage || !!sourcePost;
  // apply title and content if converting a page into a reward

  // TODO - Apply templates
  // useEffect(() => {
  //   if (sourceTemplate) {
  //     applyTemplate(sourceTemplate);
  //   }
  // }, [sourceTemplate]);

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
                pageType={formInputs.type}
                isNewPage
                customTitle={canCreateReward ? undefined : 'Creating new reward is disabled'}
              />
              {formInputs.headerImage && <PageBanner headerImage={formInputs.headerImage} setPage={setFormInputs} />}
              <StyledContainer data-test='page-charmeditor' top={defaultPageTop} fullWidth={isSmallScreen}>
                <Box minHeight={450}>
                  <PageTitleInput
                    readOnly={false}
                    updatedAt={new Date().toString()}
                    value={formInputs.title || ''}
                    onChange={(updatedPage) => {
                      setFormInputs(updatedPage);
                      if ('title' in updatedPage) {
                        setPageTitle(updatedPage.title || '');
                      }
                    }}
                    focusDocumentEditor={focusDocumentEditor}
                    placeholder='Title (required)'
                  />
                  <div className='focalboard-body font-family-default'>
                    <div className='CardDetail content'>
                      <div className='octo-propertylist'>
                        {/* Select a template for new rewards */}
                        {!isTemplate && (
                          <>
                            <Box className='octo-propertyrow'>
                              <PropertyLabel readOnly highlighted required={isTemplateRequired}>
                                Template
                              </PropertyLabel>
                              <Box display='flex' flex={1}>
                                <TemplateSelect
                                  options={templatePageOptions}
                                  value={formInputs.rewardTemplateId}
                                  onChange={(page) => {
                                    if (page === null) {
                                      clearTemplate();
                                      // if user has not updated the content, then just overwrite everything
                                    } else if (formInputs.contentText?.length === 0) {
                                      setTemplateId(page.id);
                                    } else {
                                      // set value to trigger a prompt
                                      setSelectedRewardTemplateId(page.id);
                                    }
                                  }}
                                />
                              </Box>
                            </Box>

                            <Divider />
                          </>
                        )}
                        <RewardPropertiesBase
                          rewardStatus='draft'
                          rewardFormInputs={formInputs}
                          setRewardFormInputs={setFormInputs}
                          readOnlyAuthors={!isAdmin && !!sourceTemplate?.authors.length}
                          readOnlyCustomProperties={readOnlyCustomProperties}
                          readOnlySelectedCredentialTemplates={readOnlySelectedCredentialTemplates}
                          isStructuredReward={isStructured}
                          isRewardTemplate={!!isTemplate}
                        />
                      </div>
                    </div>
                  </div>
                  <CharmEditor
                    placeholderText={`Describe the reward. Type '/' to see the list of available commands`}
                    content={formInputs.content as PageContent}
                    autoFocus={false}
                    enableVoting={false}
                    containerWidth={containerWidth}
                    pageType='reward'
                    disableNestedPages
                    onContentChange={applyRewardContent}
                    focusOnInit
                    isContentControlled
                    key={`${contentTemplateId ?? formInputs.sourcePageId ?? formInputs.sourcePostId}`}
                  />
                </Box>
              </StyledContainer>
            </Box>
            <StickyFooterContainer>
              <>
                <Button
                  disabled={isCreatingReward}
                  loading={isCreatingReward && submittedDraft}
                  data-test='create-reward-button'
                  variant='outlined'
                  onClick={() => saveForm({ isDraft: true })}
                >
                  Save draft
                </Button>
                <Button
                  data-test='publish-new-reward-button'
                  disabled={Boolean(disabledTooltip) || isCreatingReward}
                  disabledTooltip={disabledTooltip}
                  onClick={() => saveForm()}
                  loading={isCreatingReward && !submittedDraft}
                >
                  Publish
                </Button>
              </>
            </StickyFooterContainer>
          </Box>
        </DocumentColumn>
        <RewardSidebar
          isUnpublishedReward
          isOpen={internalSidebarView === 'reward_evaluation'}
          isRewardTemplate={!!isTemplate}
          isStructuredReward={isStructured}
          closeSidebar={() => setActiveView(null)}
          openSidebar={() => setActiveView('reward_evaluation')}
          rewardInput={isFormLoaded ? formInputs : undefined}
          templateId={formInputs.rewardTemplateId}
          onChangeEvaluation={(evaluationId, updates) => {
            const evaluations = formInputs.evaluations.map((e) => (e.id === evaluationId ? { ...e, ...updates } : e));
            setFormInputs({
              ...formInputs,
              evaluations
            });
          }}
          onChangeRewardSettings={(_values) => {
            setFormInputs({
              ...formInputs,
              fields: {
                ...formInputs.fields,
                ..._values
              }
            });
          }}
          onChangeWorkflow={applyWorkflow}
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
            setTemplateId(selectedRewardTemplateId!);
            setSelectedRewardTemplateId(null);
          }}
        />
      </DocumentColumnLayout>
    </Box>
  );
}
