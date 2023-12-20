import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalEvaluationPermission } from '@charmverse/core/prisma';
import type { PageType } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, Divider, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
import { useElementSize } from 'usehooks-ts';
import { v4 as uuid } from 'uuid';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import PageHeader, { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { PrimaryColumn } from 'components/[pageId]/DocumentPage/components/PrimaryColumn';
import { PageSidebar } from 'components/[pageId]/DocumentPage/components/Sidebar/PageSidebar';
import { StickyFooterContainer } from 'components/[pageId]/DocumentPage/components/StickyFooterContainer';
import { usePageSidebar } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import type { PageSidebarView } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
import { FormFieldInputs } from 'components/common/form/FormFieldInputs';
import { ControlledFormFieldsEditor, FormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import type { FormFieldInput } from 'components/common/form/interfaces';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePreventReload } from 'hooks/usePreventReload';
import { useUser } from 'hooks/useUser';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import type { ProposalRubricCriteriaWithTypedParams } from 'lib/proposal/rubric/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { fontClassName } from 'theme/fonts';

import { EvaluationStepper } from './components/EvaluationStepper/EvaluationStepper';
import type { ProposalPropertiesInput } from './components/ProposalProperties/ProposalPropertiesBase';
import { ProposalPropertiesBase } from './components/ProposalProperties/ProposalPropertiesBase';
import { TemplateSelect } from './components/TemplateSelect';
import { WorkflowSelect } from './components/WorkflowSelect';
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
  const isCharmVerse = useIsCharmverseSpace();
  const { activeView: sidebarView, setActiveView, closeSidebar } = usePageSidebar();
  const { proposalTemplates, isLoadingTemplates } = useProposalTemplates();
  const [selectedProposalTemplateId, setSelectedProposalTemplateId] = useState<null | string>(null);
  const [, setPageTitle] = usePageTitle();
  const { data: workflowOptions } = useGetProposalWorkflows(currentSpace?.id);
  const [workflowId, setWorkflowId] = useState('');
  const { formInputs, setFormInputs, contentUpdated, disabledTooltip, isCreatingProposal, createProposal } =
    useNewProposal({
      newProposal: { type: isTemplate ? 'proposal_template' : 'proposal', proposalType }
    });

  const [, { width: containerWidth }] = useElementSize();
  const { user } = useUser();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const [readOnlyEditor, setReadOnlyEditor] = useState(false);
  const isAdmin = useIsAdmin();
  const isReviewer = formInputs.reviewers?.some((r) => r.id === user?.id);

  function toggleCollapse(fieldId: string) {
    if (collapsedFieldIds.includes(fieldId)) {
      setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
    } else {
      setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
    }
  }

  usePreventReload(contentUpdated);

  const isFromTemplateSource = Boolean(formInputs.proposalTemplateId);
  const isTemplateRequired = Boolean(currentSpace?.requireProposalTemplate);
  // rubric criteria can always be updated by reviewers and admins
  const readOnlyRubricCriteria = isFromTemplateSource && !(isAdmin || isReviewer);

  useEffect(() => {
    if (isTemplateRequired) {
      setReadOnlyEditor(!formInputs.proposalTemplateId);
    }
  }, [formInputs.proposalTemplateId, isTemplateRequired]);

  const readOnlyReviewers = !!proposalTemplates?.some(
    (t) => t.id === formInputs?.proposalTemplateId && t.reviewers.length > 0
  );
  const templateOptions = (proposalTemplates || [])
    .filter((_proposal) => {
      if (!formInputs.categoryId) {
        return true;
      }
      return _proposal.categoryId === formInputs.categoryId;
    })
    .map((template) => template.page);
  const { pages } = usePages();

  const sourceTemplate = isFromTemplateSource
    ? proposalTemplates?.find((template) => template.id === formInputs.proposalTemplateId)
    : undefined;
  const proposalTemplatePage = formInputs.proposalTemplateId ? pages[formInputs.proposalTemplateId] : null;

  // properties with values from templates should be read only
  const readOnlyCustomProperties =
    !isAdmin && sourceTemplate?.fields
      ? Object.entries((sourceTemplate?.fields as ProposalFields).properties)?.reduce((acc, [key, value]) => {
          if (!value) {
            return acc;
          }

          acc.push(key);
          return acc;
        }, [] as string[])
      : [];

  function updateProposalContent({ doc, rawText }: ICharmEditorOutput) {
    setFormInputs({
      content: doc,
      contentText: rawText
    });
  }

  function selectEvaluationWorkflow(workflow: ProposalWorkflowTyped) {
    setFormInputs({
      workflowId: workflow.id,
      evaluations: workflow.evaluations.map((evaluation, index) => ({
        id: uuid(),
        index,
        reviewers: [],
        rubricCriteria: [] as ProposalRubricCriteriaWithTypedParams[],
        title: evaluation.title,
        type: evaluation.type,
        result: null,
        permissions: evaluation.permissions as ProposalEvaluationPermission[]
      }))
    });
    setWorkflowId(workflow.id);
  }

  function clearTemplate() {
    setFormInputs({
      proposalTemplateId: null
    });
  }

  async function saveForm() {
    await createProposal();
    navigateToSpacePath(`/proposals`);
  }

  function applyTemplate(_templateId: string) {
    const template = proposalTemplates?.find((t) => t.id === _templateId);
    if (template) {
      setFormInputs({
        categoryId: template.categoryId,
        content: template.page.content as PageContent,
        contentText: template.page.contentText,
        reviewers: template.reviewers.map((reviewer) => ({
          group: reviewer.roleId ? 'role' : 'user',
          id: reviewer.roleId ?? (reviewer.userId as string)
        })),
        proposalTemplateId: _templateId,
        headerImage: template.page.headerImage,
        icon: template.page.icon,
        workflowId: template.workflowId,
        evaluationType: template.evaluationType,
        evaluations: template.evaluations,
        rubricCriteria: template.rubricCriteria,
        fields: (template.fields as ProposalFields) || {},
        type: 'proposal'
      });
    }
  }

  // having `internalSidebarView` allows us to have the sidebar open by default, because usePageSidebar() does not allow us to do this currently
  const [defaultSidebarView, setDefaultView] = useState<PageSidebarView | null>(
    isCharmVerse ? 'proposal_evaluation_settings' : null
  );
  const internalSidebarView = defaultSidebarView || sidebarView;

  const proposalPageContent = (
    <>
      <PageHeader
        headerImage={formInputs.headerImage}
        icon={formInputs.icon}
        readOnly={false}
        updatedAt={new Date().toString()}
        title={formInputs.title || ''}
        // readOnly={readOnly || !!enableSuggestingMode}
        setPage={(updatedPage) => {
          setFormInputs(updatedPage);
          if ('title' in updatedPage) {
            setPageTitle(updatedPage.title || '');
          }
        }}
        placeholder='Title (required)'
      />
      {isCharmVerse && (
        <>
          <Box my={2} mb={1}>
            <EvaluationStepper evaluations={formInputs.evaluations} disabled isDraft={true} />
          </Box>
          <Divider />
        </>
      )}
      <div className='focalboard-body font-family-default'>
        <div className='CardDetail content'>
          <div className='octo-propertylist'>
            {/* Select a template for new proposals */}
            {!isTemplate && (
              <Box className='octo-propertyrow' mb='0 !important'>
                <PropertyLabel readOnly highlighted required={isTemplateRequired}>
                  Template
                </PropertyLabel>
                <Box display='flex' flex={1}>
                  <TemplateSelect
                    options={templateOptions}
                    value={proposalTemplatePage ?? null}
                    onChange={(template) => {
                      if (template === null) {
                        clearTemplate();
                        // if user has not updated the content, then just overwrite everything
                      } else if (formInputs.contentText?.length === 0) {
                        applyTemplate(template.id);
                      } else {
                        // set value to trigger a prompt
                        setSelectedProposalTemplateId(template?.id ?? null);
                      }
                    }}
                  />
                </Box>
              </Box>
            )}
            {isCharmVerse && (
              <Box className='octo-propertyrow' mb='0 !important'>
                <PropertyLabel readOnly required highlighted>
                  Workflow
                </PropertyLabel>
                <WorkflowSelect value={workflowId} onChange={selectEvaluationWorkflow} options={workflowOptions} />
              </Box>
            )}
            <ProposalPropertiesBase
              isFromTemplate={isFromTemplateSource}
              readOnlyRubricCriteria={readOnlyRubricCriteria}
              readOnlyReviewers={readOnlyReviewers}
              readOnlyProposalEvaluationType={isFromTemplateSource}
              proposalStatus='draft'
              proposalFormInputs={formInputs}
              isTemplate={formInputs.type === 'proposal_template'}
              setProposalFormInputs={setFormInputs}
              onChangeRubricCriteria={(rubricCriteria) => {
                setFormInputs({
                  ...formInputs,
                  rubricCriteria
                });
              }}
              readOnlyCustomProperties={readOnlyCustomProperties}
              isCharmVerse={isCharmVerse}
            />
          </div>
        </div>
      </div>
      {currentSpace && (
        <PageSidebar
          isNewProposal
          id='page-action-sidebar'
          spaceId={currentSpace.id}
          sidebarView={internalSidebarView || null}
          closeSidebar={closeSidebar}
          openSidebar={setActiveView}
          proposalInput={formInputs}
          onChangeEvaluation={(evaluationId, updates) => {
            const evaluations = formInputs.evaluations.map((e) => (e.id === evaluationId ? { ...e, ...updates } : e));
            setFormInputs({
              ...formInputs,
              evaluations
            });
          }}
        />
      )}
    </>
  );

  useEffect(() => {
    // clear out page title on load
    setPageTitle('');
    if (isCharmVerse) {
      setActiveView('proposal_evaluation_settings');
      setDefaultView(null);
    }
  }, []);

  // populate workflow if not set and template is not selected
  useEffect(() => {
    if (isCharmVerse && workflowOptions?.length && !workflowId && !templateIdFromUrl) {
      selectEvaluationWorkflow(workflowOptions[0]);
    }
  }, [!!workflowOptions, isCharmVerse]);

  // populate with template if selected
  useEffect(() => {
    if (templateIdFromUrl && !isLoadingTemplates) {
      applyTemplate(templateIdFromUrl);
    }
  }, [templateIdFromUrl, isLoadingTemplates]);

  return (
    <Box flexGrow={1} minHeight={0} /** add minHeight so that flexGrow expands to correct heigh */>
      <PrimaryColumn showPageActionSidebar={!!internalSidebarView}>
        <Box className={`document-print-container ${fontClassName}`} display='flex' flexDirection='column'>
          <PageTemplateBanner pageType={formInputs.type} isNewPage />
          {formInputs.headerImage && <PageBanner headerImage={formInputs.headerImage} setPage={setFormInputs} />}
          <StyledContainer data-test='page-charmeditor' top={getPageTop(formInputs)} fullWidth={isSmallScreen}>
            <Box minHeight={450}>
              {formInputs.proposalType === 'structured' ? (
                <>
                  {proposalPageContent}
                  {formInputs.type === 'proposal_template' ? (
                    <ControlledFormFieldsEditor
                      collapsedFieldIds={collapsedFieldIds}
                      toggleCollapse={toggleCollapse}
                      formFields={formInputs.formFields || []}
                      setFormFields={(formFields) => {
                        setFormInputs({
                          ...formInputs,
                          formFields
                        });
                      }}
                    />
                  ) : (
                    <FormFieldInputs formFields={formInputs.formFields || []} />
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
                  onContentChange={updateProposalContent}
                  focusOnInit
                  isContentControlled
                  key={`${String(formInputs.proposalTemplateId)}.${readOnlyEditor}`}
                >
                  {/* temporary? disable editing of page title when in suggestion mode */}
                  {proposalPageContent}
                </CharmEditor>
              )}
            </Box>
          </StyledContainer>
        </Box>
        <StickyFooterContainer>
          <Button
            disabled={Boolean(disabledTooltip) || isCreatingProposal}
            disabledTooltip={disabledTooltip}
            onClick={saveForm}
            loading={isCreatingProposal}
            data-test='create-proposal-button'
          >
            Save
          </Button>
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
