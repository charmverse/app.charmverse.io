import type { ProposalEvaluationPermission } from '@charmverse/core/prisma';
import type { PageType } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, Divider, useMediaQuery } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from 'usehooks-ts';
import { v4 as uuid } from 'uuid';

import { useForumPost } from 'charmClient/hooks/forum';
import { useGetPage } from 'charmClient/hooks/pages';
import { useGetProposalTemplate } from 'charmClient/hooks/proposals';
import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import { DocumentColumnLayout, DocumentColumn } from 'components/[pageId]/DocumentPage/components/DocumentColumnLayout';
import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { ProposalSidebar } from 'components/[pageId]/DocumentPage/components/Sidebar/ProposalSidebar';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { defaultPageTop } from 'components/[pageId]/DocumentPage/DocumentPage';
import { usePageSidebar } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import type { PageSidebarView } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { focusEventName } from 'components/common/CharmEditor/constants';
import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { FormFieldAnswersControlled } from 'components/common/form/FormFieldAnswers';
import { ControlledFormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import { getInitialFormFieldValue, useFormFields } from 'components/common/form/hooks/useFormFields';
import type { FieldAnswerInput, FormFieldInput } from 'components/common/form/interfaces';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { authorSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import { useUser } from 'hooks/useUser';
import type { ProposalTemplateMeta } from 'lib/proposals/getProposalTemplates';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';
import type { RubricCriteriaTyped } from 'lib/proposals/rubric/interfaces';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { fontClassName } from 'theme/fonts';

import { getNewCriteria } from './components/ProposalEvaluations/components/Settings/components/RubricCriteriaSettings';
import { ProposalRewardsTable } from './components/ProposalProperties/components/ProposalRewards/ProposalRewardsTable';
import type { ProposalPropertiesInput } from './components/ProposalProperties/ProposalPropertiesBase';
import { ProposalPropertiesBase } from './components/ProposalProperties/ProposalPropertiesBase';
import { TemplateSelect } from './components/TemplateSelect';
import { useNewProposal } from './hooks/useNewProposal';

export type ProposalPageAndPropertiesInput = ProposalPropertiesInput & {
  title?: string; // title is saved to the same state that's used in ProposalPage
  content?: PageContent | null;
  contentText?: string;
  headerImage: string | null;
  icon: string | null;
  type: PageType;
  proposalType: 'structured' | 'free_form';
  formFields?: FormFieldInput[];
  formAnswers?: FieldAnswerInput[];
  formId?: string;
};

const StyledContainer = styled(PageEditorContainer)`
  margin-bottom: 180px;
`;
// Note: this component is only used before a page is saved to the DB
export function NewProposalPage({
  isTemplate,
  templateId: templateIdFromUrl,
  proposalType,
  sourcePageId,
  sourcePostId
}: {
  isTemplate?: boolean;
  templateId?: string;
  proposalType?: ProposalPageAndPropertiesInput['proposalType'];
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
  const { proposalTemplates } = useProposalTemplates();
  const [selectedProposalTemplateId, setSelectedProposalTemplateId] = useState<null | string>();
  const [contentTemplateId, setContentTemplateId] = useState<null | string>(); // used to keep charm editor content up-to-date
  const [, setPageTitle] = usePageTitle();
  const { data: workflowOptions, isLoading: isLoadingWorkflows } = useGetProposalWorkflows(currentSpace?.id);
  const proposalPageType = isTemplate ? 'proposal_template' : 'proposal';
  const {
    formInputs,
    setFormInputs,
    contentUpdated,
    disabledTooltip: _disabledTooltip,
    isCreatingProposal,
    isFormLoaded,
    createProposal
  } = useNewProposal({
    newProposal: { type: proposalPageType, proposalType }
  });
  const { data: sourceTemplate } = useGetProposalTemplate(formInputs.proposalTemplateId);
  const [submittedDraft, setSubmittedDraft] = useState<boolean>(false);

  const containerWidthRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth = 0 } = useResizeObserver({ ref: containerWidthRef });
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const isAdmin = useIsAdmin();

  const canCreateProposal = !spacePermissions || !!spacePermissions[0]?.createProposals;
  const isStructured = formInputs.proposalType === 'structured' || !!formInputs.formId;
  const pendingRewards = formInputs.fields?.pendingRewards || [];
  const proposalFormFields = isStructured
    ? formInputs.formFields ?? [
        {
          type: 'short_text',
          name: '',
          description: emptyDocument,
          index: 0,
          options: [],
          private: false,
          required: true,
          id: uuid(),
          extraFields: {}
        } as FormFieldInput
      ]
    : [];

  const {
    control: proposalFormFieldControl,
    isValid: isProposalFormFieldsValid,
    errors: proposalFormFieldErrors,
    onFormChange
  } = useFormFields({
    // Only set the initial state with fields when we are creating a structured proposal
    fields: isStructured && formInputs.type === 'proposal' ? proposalFormFields : []
  });

  let disabledTooltip = _disabledTooltip;
  if (!disabledTooltip && !isProposalFormFieldsValid) {
    disabledTooltip = 'Please provide correct values for all proposal form fields';
  }
  if (!canCreateProposal) {
    disabledTooltip = 'You do not have permission to create proposal';
  }

  function toggleCollapse(fieldId: string) {
    if (collapsedFieldIds.includes(fieldId)) {
      setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
    } else {
      setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
    }
  }
  usePreventReload(contentUpdated);

  const isTemplateRequired = Boolean(currentSpace?.requireProposalTemplate);
  const templatePageOptions = (proposalTemplates || []).map((template) => ({
    id: template.proposalId,
    title: template.title
  }));
  const { pages } = usePages();

  const proposalTemplatePage = formInputs.proposalTemplateId ? pages[formInputs.proposalTemplateId] : null;

  const readOnlySelectedCredentialTemplates = sourceTemplate?.selectedCredentialTemplates && !isAdmin;

  // properties with values from templates should be read only
  const readOnlyCustomProperties =
    !isAdmin && sourceTemplate?.fields
      ? Object.entries(sourceTemplate?.fields?.properties || {})?.reduce((acc, [key, value]) => {
          if (!value) {
            return acc;
          }

          acc.push(key);
          return acc;
        }, [] as string[])
      : [];

  function focusDocumentEditor() {
    const focusEvent = new CustomEvent(focusEventName);
    // TODO: use a ref passed down instead
    document.querySelector(`.bangle-editor-core`)?.dispatchEvent(focusEvent);
  }

  function setTemplateId(_templateId: string) {
    setFormInputs({
      proposalTemplateId: _templateId
    });
  }
  function applyTemplate(template: ProposalWithUsersAndRubric) {
    const formFields = template.form?.formFields ?? [];
    const authors = Array.from(new Set([user!.id].concat(template.authors.map((author) => author.userId))));
    const page = template.page!;
    setFormInputs(
      {
        authors,
        content: page.content as PageContent,
        contentText: page.contentText,
        selectedCredentialTemplates: template.selectedCredentialTemplates ?? [],
        headerImage: null,
        icon: null,
        evaluations: template.evaluations,
        fields:
          {
            ...template.fields,
            pendingRewards: template.fields?.pendingRewards?.map((pendingReward) => ({
              ...pendingReward,
              reward: {
                ...pendingReward.reward,
                assignedSubmitters: authors
              }
            }))
          } || {},
        type: proposalPageType,
        formId: template.formId ?? undefined,
        formFields: isTemplate ? formFields.map((formField) => ({ ...formField, id: uuid() })) : formFields,
        formAnswers: (template?.form?.formFields ?? [])
          .filter((formField) => formField.type !== 'label')
          .map((proposalFormField) => ({
            fieldId: proposalFormField.id,
            value: getInitialFormFieldValue(proposalFormField) as FieldAnswerInput['value']
          }))
      },
      { fromUser: false }
    );
    setContentTemplateId(template.id);
    const workflow = workflowOptions?.find((w) => w.id === template.workflowId);
    if (workflow) {
      // pass in the template since the formState will not be updated in this instance of applyWorkflow
      applyWorkflow(workflow, template);
    }
  }

  function clearTemplate() {
    setFormInputs({
      proposalTemplateId: null
    });
  }

  function applyWorkflow(workflow: ProposalWorkflowTyped, template?: ProposalWithUsersAndRubric) {
    setFormInputs(
      {
        workflowId: workflow.id,
        evaluations: workflow.evaluations.map((evaluation, index) => {
          // try to retain existing reviewers and configuration
          const existingStep = (template?.evaluations || formInputs.evaluations).find(
            (e) => e.title === evaluation.title
          );
          const rubricCriteria = (
            evaluation.type === 'rubric' ? existingStep?.rubricCriteria || [getNewCriteria()] : []
          ) as RubricCriteriaTyped[];
          // include author as default reviewer for feedback
          const defaultReviewers = evaluation.type === 'feedback' && user ? [{ systemRole: authorSystemRole.id }] : [];
          return {
            id: evaluation.id,
            index,
            reviewers: existingStep?.reviewers || defaultReviewers,
            rubricCriteria,
            title: evaluation.title,
            type: evaluation.type,
            result: null,
            voteSettings: existingStep?.voteSettings,
            permissions: evaluation.permissions as ProposalEvaluationPermission[]
          };
        })
      },
      { fromUser: false }
    );
  }

  function applyProposalContent({ doc, rawText }: ICharmEditorOutput) {
    setFormInputs({
      content: doc,
      contentText: rawText
    });
  }

  async function saveForm({ isDraft }: { isDraft?: boolean } = {}) {
    setSubmittedDraft(!!isDraft);
    const result = await createProposal({ isDraft });
    if (result) {
      navigateToSpacePath(`/${result.id}`);
    }
  }

  // having `internalSidebarView` allows us to have the sidebar open by default, because usePageSidebar() does not allow us to do this currently
  const [defaultSidebarView, setDefaultView] = useState<PageSidebarView | null>('proposal_evaluation');
  const internalSidebarView = defaultSidebarView || sidebarView;

  useEffect(() => {
    // clear out page title on load
    setPageTitle('');
    setActiveView('proposal_evaluation');
    setDefaultView(null);
  }, []);

  useEffect(() => {
    if (!isLoadingWorkflows) {
      // populate with template if selected
      if (templateIdFromUrl) {
        setTemplateId(templateIdFromUrl);
      }
      // populate workflow if not set and template is not selected
      else if (workflowOptions?.length) {
        applyWorkflow(workflowOptions[0]);
      }
    }
  }, [templateIdFromUrl, isLoadingWorkflows]);

  // Keep the formAnswers in sync with the formFields using a ref as charmEditor fields uses the initial field value
  const formAnswersRef = useRef(formInputs.formAnswers);

  useEffect(() => {
    formAnswersRef.current = formInputs.formAnswers;
  }, [formInputs.formAnswers]);

  const hasSource = !!sourcePage || !!sourcePost;
  // apply title and content if converting a page into a proposal
  useEffect(() => {
    if (sourcePage) {
      setFormInputs(
        {
          content: sourcePage.content as any,
          contentText: sourcePage.contentText,
          title: sourcePage.title,
          sourcePageId: sourcePage.id
        },
        { fromUser: false }
      );
    } else if (sourcePost) {
      setFormInputs(
        {
          content: sourcePost.content as any,
          contentText: sourcePost.contentText,
          title: sourcePost.title,
          sourcePostId: sourcePost.id
        },
        { fromUser: false }
      );
    }
  }, [hasSource]);

  // watch for changes in isTemplate
  useEffect(() => {
    if (isTemplate) {
      setFormInputs(
        {
          type: 'proposal_template',
          proposalTemplateId: null
        },
        { fromUser: false }
      );
    } else {
      setFormInputs(
        {
          type: 'proposal'
        },
        { fromUser: false }
      );
    }
  }, [isTemplate, setFormInputs]);

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
                pageType={formInputs.type}
                isNewPage
                customTitle={canCreateProposal ? undefined : 'Creating new proposal is disabled'}
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
                        {/* Select a template for new proposals */}
                        {!isTemplate && (
                          <>
                            <Box className='octo-propertyrow'>
                              <PropertyLabel readOnly highlighted required={isTemplateRequired}>
                                Template
                              </PropertyLabel>
                              <Box display='flex' flex={1}>
                                <TemplateSelect
                                  options={templatePageOptions}
                                  value={proposalTemplatePage ?? null}
                                  onChange={(page) => {
                                    if (page === null) {
                                      clearTemplate();
                                      // if user has not updated the content, then just overwrite everything
                                    } else if (formInputs.contentText?.length === 0) {
                                      setTemplateId(page.id);
                                    } else {
                                      // set value to trigger a prompt
                                      setSelectedProposalTemplateId(page.id);
                                    }
                                  }}
                                />
                              </Box>
                            </Box>

                            <Divider />
                          </>
                        )}
                        <ProposalPropertiesBase
                          proposalStatus='draft'
                          proposalFormInputs={formInputs}
                          setProposalFormInputs={setFormInputs}
                          readOnlyAuthors={!isAdmin && !!sourceTemplate?.authors.length}
                          readOnlyCustomProperties={readOnlyCustomProperties}
                          readOnlySelectedCredentialTemplates={readOnlySelectedCredentialTemplates}
                          isStructuredProposal={isStructured}
                          isProposalTemplate={!!isTemplate}
                        />
                      </div>
                    </div>
                  </div>
                  {isStructured ? (
                    formInputs.type === 'proposal_template' ? (
                      <ControlledFormFieldsEditor
                        collapsedFieldIds={collapsedFieldIds}
                        toggleCollapse={toggleCollapse}
                        formFields={proposalFormFields}
                        setFormFields={(formFields) => {
                          setFormInputs({
                            formFields
                          });
                        }}
                      />
                    ) : (
                      <FormFieldAnswersControlled
                        control={proposalFormFieldControl}
                        enableComments={false}
                        errors={proposalFormFieldErrors}
                        onFormChange={(updatedFormFields) => {
                          setFormInputs({
                            formAnswers: formAnswersRef.current?.map((formAnswer) => {
                              const updatedFormField = updatedFormFields.find((f) => f.id === formAnswer.fieldId);

                              if (!updatedFormField) {
                                return formAnswer;
                              }
                              return {
                                ...formAnswer,
                                value: updatedFormField.value
                              };
                            })
                          });
                          onFormChange(updatedFormFields);
                        }}
                        formFields={proposalFormFields}
                      />
                    )
                  ) : (
                    <CharmEditor
                      placeholderText={`Describe the proposal. Type '/' to see the list of available commands`}
                      content={formInputs.content as PageContent}
                      autoFocus={false}
                      enableVoting={false}
                      containerWidth={containerWidth}
                      pageType='proposal'
                      disableNestedPages
                      onContentChange={applyProposalContent}
                      focusOnInit
                      isContentControlled
                      key={`${contentTemplateId ?? formInputs.sourcePageId ?? formInputs.sourcePostId}`}
                    />
                  )}
                  {isStructured && formInputs.fields?.enableRewards && (
                    <Box mt={1}>
                      <ProposalRewardsTable
                        containerWidth={containerWidth}
                        pendingRewards={pendingRewards}
                        requiredTemplateId={formInputs.fields?.rewardsTemplateId}
                        reviewers={formInputs.evaluations.map((e) => e.reviewers.filter((r) => !r.systemRole)).flat()}
                        assignedSubmitters={formInputs.authors}
                        variant='solid_button'
                        isProposalTemplate={!!isTemplate}
                        rewardIds={[]}
                        onSave={(pendingReward) => {
                          const isExisting = pendingRewards.find((reward) => reward.draftId === pendingReward.draftId);
                          if (!isExisting) {
                            setFormInputs({
                              fields: {
                                ...formInputs.fields,
                                pendingRewards: [...(formInputs.fields?.pendingRewards || []), pendingReward]
                              }
                            });

                            return;
                          }

                          setFormInputs({
                            fields: {
                              ...formInputs.fields,
                              pendingRewards: (formInputs.fields?.pendingRewards || []).map((draft) => {
                                if (draft.draftId === pendingReward.draftId) {
                                  return pendingReward;
                                }
                                return draft;
                              })
                            }
                          });
                        }}
                        onDelete={(draftId: string) => {
                          setFormInputs({
                            fields: {
                              ...formInputs.fields,
                              pendingRewards: (formInputs.fields?.pendingRewards || []).filter(
                                (draft) => draft.draftId !== draftId
                              )
                            }
                          });
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </StyledContainer>
            </Box>
            <StickyFooterContainer>
              <>
                <Button
                  disabled={isCreatingProposal}
                  loading={isCreatingProposal && submittedDraft}
                  data-test='create-proposal-button'
                  variant='outlined'
                  onClick={() => saveForm({ isDraft: true })}
                >
                  Save draft
                </Button>
                <Button
                  data-test='publish-new-proposal-button'
                  disabled={Boolean(disabledTooltip) || isCreatingProposal}
                  disabledTooltip={disabledTooltip}
                  onClick={() => saveForm()}
                  loading={isCreatingProposal && !submittedDraft}
                >
                  Publish
                </Button>
              </>
            </StickyFooterContainer>
          </Box>
        </DocumentColumn>
        <ProposalSidebar
          isUnpublishedProposal
          isOpen={internalSidebarView === 'proposal_evaluation'}
          isProposalTemplate={!!isTemplate}
          isStructuredProposal={isStructured}
          closeSidebar={() => setActiveView(null)}
          openSidebar={() => setActiveView('proposal_evaluation')}
          proposalInput={isFormLoaded ? formInputs : undefined}
          templateId={formInputs.proposalTemplateId}
          onChangeEvaluation={(evaluationId, updates) => {
            const evaluations = formInputs.evaluations.map((e) => (e.id === evaluationId ? { ...e, ...updates } : e));
            setFormInputs({
              ...formInputs,
              evaluations
            });
          }}
          onChangeRewardSettings={(values) => {
            setFormInputs({
              ...formInputs,
              fields: {
                ...formInputs.fields,
                ...values
              }
            });
          }}
          onChangeWorkflow={applyWorkflow}
        />
        <ConfirmDeleteModal
          onClose={() => {
            setSelectedProposalTemplateId(null);
          }}
          open={!!selectedProposalTemplateId}
          title='Overwriting your content'
          buttonText='Overwrite'
          secondaryButtonText='Go back'
          question='Are you sure you want to overwrite your current content with the proposal template content?'
          onConfirm={() => {
            setTemplateId(selectedProposalTemplateId!);
            setSelectedProposalTemplateId(null);
          }}
        />
      </DocumentColumnLayout>
    </Box>
  );
}
