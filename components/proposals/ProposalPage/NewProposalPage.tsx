import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalEvaluationPermission } from '@charmverse/core/prisma';
import type { PageType } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material';
import { Box, DialogActions, Divider, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
import { useElementSize } from 'usehooks-ts';
import { v4 as uuid } from 'uuid';

import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import PageBanner from 'components/[pageId]/DocumentPage/components/PageBanner';
import { getPageTop } from 'components/[pageId]/DocumentPage/components/PageHeader';
import { PageTemplateBanner } from 'components/[pageId]/DocumentPage/components/PageTemplateBanner';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { usePageSidebar } from 'components/[pageId]/DocumentPage/components/Sidebar/hooks/usePageSidebar';
import { PageSidebar } from 'components/[pageId]/DocumentPage/components/Sidebar/PageSidebar';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/CharmEditor';
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
import type { NewProposalInput } from './hooks/useNewProposal';
import { useNewProposal } from './hooks/useNewProposal';

export type ProposalPageAndPropertiesInput = ProposalPropertiesInput & {
  title?: string; // title is saved to the same state that's used in ProposalPage
  content?: PageContent | null;
  contentText?: string;
  headerImage: string | null;
  icon: string | null;
  type: PageType;
};

const StyledContainer = styled(Container)`
  margin-bottom: 180px;
`;

const PrimaryColumn = styled(Box)<{ showPageActionSidebar: boolean }>(
  ({ showPageActionSidebar, theme }) => `
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('lg')} {
    width: ${showPageActionSidebar ? 'calc(100% - 430px)' : '100%'};
    height: calc(100vh - 65px);
    // overflow: ${showPageActionSidebar ? 'auto' : 'inherit'};
  }
`
);
const StickyFooterContainer = styled(Box)`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  padding: 0 40px 0 30px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    width: 860px;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: 0 80px;
  }
`;

// Note: this component is only used before a page is saved to the DB
export function NewProposalPage({ isTemplate, templateId }: { isTemplate?: boolean; templateId?: string }) {
  const { router, navigateToSpacePath } = useCharmRouter();
  const { space: currentSpace } = useCurrentSpace();
  const isCharmVerse = useIsCharmverseSpace();
  const { activeView: sidebarView, setActiveView, closeSidebar } = usePageSidebar();
  const { proposalTemplates, isLoadingTemplates } = useProposalTemplates();
  const [selectedProposalTemplateId, setSelectedProposalTemplateId] = useState<null | string>(null);
  const [, setPageTitle] = usePageTitle();
  const { data: workflowOptions } = useGetProposalWorkflows(currentSpace?.id);
  const selectedTemplate = router.query.template as string;
  const [workflowId, setWorkflowId] = useState('');
  const proposalTemplate = proposalTemplates?.find((t) => t.id === selectedTemplate);
  const newProposal: NewProposalInput = proposalTemplate
    ? {
        contentText: proposalTemplate.page.contentText ?? '',
        content: proposalTemplate.page.content as any,
        proposalTemplateId: selectedTemplate,
        evaluations: proposalTemplate.evaluations,
        evaluationType: proposalTemplate.evaluationType,
        headerImage: proposalTemplate.page.headerImage,
        icon: proposalTemplate.page.icon,
        categoryId: proposalTemplate.categoryId as string,
        reviewers: proposalTemplate.reviewers.map((reviewer) => ({
          group: reviewer.roleId ? 'role' : 'user',
          id: (reviewer.roleId ?? reviewer.userId) as string
        })),
        rubricCriteria: proposalTemplate.rubricCriteria,
        fields: (proposalTemplate.fields as any) || {},
        type: 'proposal'
      }
    : null;
  const {
    formInputs,
    setFormInputs,
    contentUpdated,
    disabledTooltip,
    isCreatingProposal,
    clearFormInputs,
    createProposal
  } = useNewProposal({
    newProposal
  });
  const [proposalEvaluationId, setProposalEvaluationId] = useState();

  const [, { width: containerWidth }] = useElementSize();
  const { user } = useUser();
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));
  const [readOnlyEditor, setReadOnlyEditor] = useState(false);
  const isAdmin = useIsAdmin();
  const isReviewer = formInputs.reviewers?.some((r) => r.id === user?.id);

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

  function applyTemplate(templatePage: PageMeta) {
    if (templatePage && templatePage.proposalId) {
      // Fetch the proposal page to get its content
      const template = proposalTemplates?.find((_proposalTemplate) => _proposalTemplate.page.id === templatePage.id);
      if (template) {
        setFormInputs({
          categoryId: template.categoryId,
          content: template.page.content as PageContent,
          contentText: template.page.contentText,
          reviewers: template.reviewers.map((reviewer) => ({
            group: reviewer.roleId ? 'role' : 'user',
            id: reviewer.roleId ?? (reviewer.userId as string)
          })),
          proposalTemplateId: templatePage.id,
          workflowId: template.workflowId,
          evaluationType: template.evaluationType,
          evaluations: template.evaluations,
          rubricCriteria: template.rubricCriteria,
          fields: (template.fields as ProposalFields) || {}
        });
      }
    }
  }

  useEffect(() => {
    if (workflowOptions?.length && !workflowId) {
      selectEvaluationWorkflow(workflowOptions[0]);
    }
  }, [!!workflowOptions]);
  const [defaultSidebarView, setDefaultView] = useState('proposal_evaluation_settings');
  useEffect(() => {
    setActiveView('proposal_evaluation_settings');
    setDefaultView('');
  }, []);
  return (
    <PrimaryColumn showPageActionSidebar={!!sidebarView} display='flex' flexDirection='column' sx={{ height: '100%' }}>
      <Box className={`document-print-container ${fontClassName}`} flexGrow={1} overflow='auto'>
        <Box display='flex' flexDirection='column'>
          <PageTemplateBanner pageType={formInputs.type} isNewPage />
          {formInputs.headerImage && <PageBanner headerImage={formInputs.headerImage} setPage={setFormInputs} />}
          <StyledContainer data-test='page-charmeditor' top={getPageTop(formInputs)} fullWidth={isSmallScreen}>
            <Box minHeight={450}>
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
                <PageTitleInput
                  updatedAt={new Date().toString()}
                  value={formInputs.title || ''}
                  onChange={(updatedPage) => {
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
                      <EvaluationStepper
                        evaluations={formInputs.evaluations}
                        disabled
                        isDraft={true} // proposalStatus === 'draft'}
                        // onClick={handleClickEvaluationStep}
                      />
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
                                  applyTemplate(template);
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
                          <WorkflowSelect
                            value={workflowId}
                            onChange={selectEvaluationWorkflow}
                            options={workflowOptions}
                          />
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
                      />
                    </div>
                    {currentSpace && (
                      <PageSidebar
                        id='page-action-sidebar'
                        spaceId={currentSpace.id}
                        sidebarView={defaultSidebarView || sidebarView ? 'proposal_evaluation_settings' : null}
                        closeSidebar={closeSidebar}
                        proposalInput={formInputs}
                        isNewProposal
                        onChangeEvaluation={(evaluationId, updates) => {
                          const evaluations = formInputs.evaluations.map((e) =>
                            e.id === evaluationId ? { ...e, ...updates } : e
                          );
                          setFormInputs({
                            ...formInputs,
                            evaluations
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
              </CharmEditor>
            </Box>
          </StyledContainer>
        </Box>
      </Box>
      <Box display='flex' flexDirection='column'>
        <Divider light />
        <StickyFooterContainer className='footer-actions'>
          <DialogActions sx={{ px: 0 }}>
            <Button
              disabled={Boolean(disabledTooltip) || !contentUpdated || isCreatingProposal}
              disabledTooltip={disabledTooltip}
              onClick={saveForm}
              loading={isCreatingProposal}
              data-test='create-proposal-button'
            >
              Save
            </Button>
          </DialogActions>
        </StickyFooterContainer>
      </Box>
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
          const templatePage = templateOptions.find((template) => template.id === selectedProposalTemplateId);
          if (templatePage) {
            applyTemplate(templatePage);
          }
          setSelectedProposalTemplateId(null);
        }}
      />
    </PrimaryColumn>
  );
}
