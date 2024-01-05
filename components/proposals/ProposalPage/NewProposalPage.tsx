import type { ProposalEvaluationPermission } from '@charmverse/core/prisma';
import type { PageType } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, Divider, useMediaQuery } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useElementSize } from 'usehooks-ts';
import { v4 as uuid } from 'uuid';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { PrimaryColumn } from 'components/[pageId]/DocumentPage/components/PrimaryColumn';
import { PageSidebar } from 'components/[pageId]/DocumentPage/components/Sidebar/PageSidebar';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { defaultPageTop } from 'components/[pageId]/DocumentPage/DocumentPage';
import { usePageSidebar } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import type { PageSidebarView } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { focusEventName } from 'components/common/CharmEditor/constants';
import { ControlledFormFieldInputs } from 'components/common/form/FormFieldInputs';
import { ControlledFormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import { getInitialFormFieldValue, useFormFields } from 'components/common/form/hooks/useFormFields';
import type { FieldAnswerInput, FormFieldInput } from 'components/common/form/interfaces';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMdScreen } from 'hooks/useMediaScreens';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import type { ProposalTemplate } from 'lib/proposal/getProposalTemplates';
import type { ProposalRubricCriteriaWithTypedParams } from 'lib/proposal/rubric/interfaces';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { fontClassName } from 'theme/fonts';

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
  proposalType?: 'structured' | 'free_form';
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
  proposalType
}: {
  isTemplate?: boolean;
  templateId?: string;
  proposalType?: ProposalPageAndPropertiesInput['proposalType'];
}) {
  const { navigateToSpacePath } = useCharmRouter();
  const { space: currentSpace } = useCurrentSpace();
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<string[]>([]);
  const { activeView: sidebarView, setActiveView } = usePageSidebar();
  const { proposalTemplates, isLoadingTemplates } = useProposalTemplates();
  const [selectedProposalTemplateId, setSelectedProposalTemplateId] = useState<null | string>();
  const [, setPageTitle] = usePageTitle();
  const { data: workflowOptions, isLoading: isLoadingWorkflows } = useGetProposalWorkflows(currentSpace?.id);
  const isMdScreen = useMdScreen();
  const proposalPageType = isTemplate ? 'proposal_template' : 'proposal';
  const {
    formInputs,
    setFormInputs,
    contentUpdated,
    disabledTooltip: _disabledTooltip,
    isCreatingProposal,
    createProposal
  } = useNewProposal({
    newProposal: { type: proposalPageType, proposalType }
  });
  const [submittedDraft, setSubmittedDraft] = useState<boolean>(false);

  const [, { width: containerWidth }] = useElementSize();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const isAdmin = useIsAdmin();

  const sourceTemplate = proposalTemplates?.find((template) => template.page.id === formInputs.proposalTemplateId);
  const isStructured = formInputs.proposalType === 'structured' || !!sourceTemplate?.formId;
  const proposalFormFields = isStructured
    ? formInputs.formFields ??
      sourceTemplate?.form?.formFields ?? [
        {
          type: 'short_text',
          name: '',
          description: emptyDocument,
          index: 0,
          options: [],
          private: false,
          required: true,
          id: uuid()
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

  function toggleCollapse(fieldId: string) {
    if (collapsedFieldIds.includes(fieldId)) {
      setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
    } else {
      setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
    }
  }
  usePreventReload(contentUpdated);

  const isTemplateRequired = Boolean(currentSpace?.requireProposalTemplate);
  const templatePageOptions = (proposalTemplates || []).map((template) => template.page);
  const { pages } = usePages();

  const proposalTemplatePage = formInputs.proposalTemplateId ? pages[formInputs.proposalTemplateId] : null;

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

  function applyTemplate(_templateId: string) {
    const template = proposalTemplates?.find((t) => t.id === _templateId);
    if (template) {
      setFormInputs({
        content: template.page.content as PageContent,
        contentText: template.page.contentText,
        reviewers: template.reviewers.map((reviewer) => ({
          group: reviewer.roleId ? 'role' : 'user',
          id: reviewer.roleId ?? (reviewer.userId as string)
        })),
        proposalTemplateId: _templateId,
        headerImage: template.page.headerImage,
        icon: template.page.icon,
        evaluationType: template.evaluationType,
        evaluations: template.evaluations,
        fields: template.fields || {},
        type: proposalPageType,
        formId: template.formId ?? undefined,
        formAnswers: (template?.form?.formFields ?? [])
          .filter((formField) => formField.type !== 'label')
          .map((proposalFormField) => ({
            fieldId: proposalFormField.id,
            value: getInitialFormFieldValue(proposalFormField) as FieldAnswerInput['value']
          }))
      });
      const workflow = workflowOptions?.find((w) => w.id === template.workflowId);
      if (workflow) {
        // pass in the template since the formState will not be updated in this instance of applyWorkflow
        applyWorkflow(workflow, template);
      }
    }
  }

  function clearTemplate() {
    setFormInputs({
      proposalTemplateId: null
    });
  }

  function applyWorkflow(workflow: ProposalWorkflowTyped, template?: ProposalTemplate) {
    setFormInputs({
      workflowId: workflow.id,
      evaluations: workflow.evaluations.map((evaluation, index) => {
        // try to retain existing reviewers and configuration
        const existingStep = (template?.evaluations || formInputs.evaluations).find(
          (e) => e.title === evaluation.title
        );
        return {
          id: evaluation.id,
          index,
          reviewers: existingStep?.reviewers || [],
          rubricCriteria: existingStep?.rubricCriteria || ([] as ProposalRubricCriteriaWithTypedParams[]),
          title: evaluation.title,
          type: evaluation.type,
          result: null,
          voteSettings: existingStep?.voteSettings,
          permissions: evaluation.permissions as ProposalEvaluationPermission[]
        };
      })
    });
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
  const [defaultSidebarView, setDefaultView] = useState<PageSidebarView | null>(
    isMdScreen ? 'proposal_evaluation' : null
  );
  const internalSidebarView = defaultSidebarView || sidebarView;

  const proposalPageContent = (
    <>
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
                          applyTemplate(page.id);
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
              readOnlyCustomProperties={readOnlyCustomProperties}
            />
          </div>
        </div>
      </div>
      {currentSpace && (
        <PageSidebar
          isUnpublishedProposal
          id='page-action-sidebar'
          spaceId={currentSpace.id}
          sidebarView={internalSidebarView || null}
          closeSidebar={() => {}}
          openSidebar={setActiveView}
          proposalInput={formInputs}
          proposalTemplateId={formInputs.proposalTemplateId}
          onChangeEvaluation={(evaluationId, updates) => {
            const evaluations = formInputs.evaluations.map((e) => (e.id === evaluationId ? { ...e, ...updates } : e));
            setFormInputs({
              ...formInputs,
              evaluations
            });
          }}
          onChangeWorkflow={applyWorkflow}
        />
      )}
    </>
  );

  useEffect(() => {
    // clear out page title on load
    setPageTitle('');
    if (isMdScreen) {
      setActiveView('proposal_evaluation');
      setDefaultView(null);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingTemplates && !isLoadingWorkflows) {
      // populate with template if selected
      if (templateIdFromUrl) {
        applyTemplate(templateIdFromUrl);
      }
      // populate workflow if not set and template is not selected
      else if (workflowOptions?.length) {
        applyWorkflow(workflowOptions[0]);
      }
    }
  }, [templateIdFromUrl, isLoadingTemplates, isLoadingWorkflows]);

  // Keep the formAnswers in sync with the formFields using a ref as charmEditor fields uses the initial field value
  const formAnswersRef = useRef(formInputs.formAnswers);

  useEffect(() => {
    formAnswersRef.current = formInputs.formAnswers;
  }, [formInputs.formAnswers]);

  return (
    <Box flexGrow={1} minHeight={0} /** add minHeight so that flexGrow expands to correct heigh */>
      <PrimaryColumn showPageActionSidebar={!!internalSidebarView}>
        <Box className={`document-print-container ${fontClassName}`} display='flex' flexDirection='column'>
          <PageTemplateBanner pageType={formInputs.type} isNewPage proposalType={formInputs.proposalType} />
          {formInputs.headerImage && <PageBanner headerImage={formInputs.headerImage} setPage={setFormInputs} />}
          <StyledContainer data-test='page-charmeditor' top={defaultPageTop} fullWidth={isSmallScreen}>
            <Box minHeight={450}>
              {isStructured ? (
                <>
                  {proposalPageContent}
                  {formInputs.type === 'proposal_template' ? (
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
                    <ControlledFormFieldInputs
                      control={proposalFormFieldControl}
                      errors={proposalFormFieldErrors}
                      onFormChange={(updatedFormFields) => {
                        setFormInputs({
                          formAnswers: formAnswersRef.current?.map((formAnswer) => {
                            const updatedFormField = updatedFormFields.find((f) => f.id === formAnswer.fieldId);
                            return {
                              ...formAnswer,
                              value: updatedFormField?.value ?? formAnswer.value
                            };
                          })
                        });
                        onFormChange(updatedFormFields);
                      }}
                      formFields={proposalFormFields}
                    />
                  )}
                </>
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
                  key={`${String(formInputs.proposalTemplateId)}`}
                >
                  {/* temporary? disable editing of page title when in suggestion mode */}
                  {proposalPageContent}
                </CharmEditor>
              )}
            </Box>
          </StyledContainer>
        </Box>
        <StickyFooterContainer>
          {isTemplate ? (
            <Button
              data-test='create-proposal-button'
              disabled={Boolean(disabledTooltip) || isCreatingProposal}
              disabledTooltip={disabledTooltip}
              onClick={() => saveForm({ isDraft: true })}
              loading={isCreatingProposal && !submittedDraft}
            >
              Save
            </Button>
          ) : (
            <>
              <Button
                disabled={Boolean(disabledTooltip) || isCreatingProposal}
                disabledTooltip={disabledTooltip}
                loading={isCreatingProposal && submittedDraft}
                data-test='create-proposal-button'
                variant='outlined'
                onClick={() => saveForm({ isDraft: true })}
              >
                Save draft
              </Button>
              <Button
                disabled={Boolean(disabledTooltip) || isCreatingProposal}
                disabledTooltip={disabledTooltip}
                onClick={() => saveForm()}
                loading={isCreatingProposal && !submittedDraft}
              >
                Publish
              </Button>
            </>
          )}
        </StickyFooterContainer>
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
            applyTemplate(selectedProposalTemplateId!);
            setSelectedProposalTemplateId(null);
          }}
        />
      </PrimaryColumn>
    </Box>
  );
}
