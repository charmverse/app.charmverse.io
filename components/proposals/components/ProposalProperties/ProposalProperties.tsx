import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type {
  Page,
  Proposal,
  ProposalEvaluationType,
  ProposalRubricCriteria,
  ProposalStatus
} from '@charmverse/core/prisma';
import type { ProposalReviewerInput } from '@charmverse/core/proposals';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Card, Collapse, Divider, Grid, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';

import charmClient from 'charmClient';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import LoadingComponent from 'components/common/LoadingComponent';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import type { TabConfig } from 'components/common/MultiTabs';
import MultiTabs from 'components/common/MultiTabs';
import { RubricResults } from 'components/proposals/components/ProposalProperties/components/RubricResults';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { CreateVoteModal } from 'components/votes/components/CreateVoteModal';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { usePages } from 'hooks/usePages';
import type { ProposalCategory } from 'lib/proposal/interface';
import type { ProposalRubricCriteriaAnswerWithTypedResponse } from 'lib/proposal/rubric/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { useProposalCategories } from '../../hooks/useProposalCategories';

import { ProposalCategorySelect } from './components/ProposalCategorySelect';
import { ProposalEvaluationTypeSelect } from './components/ProposalEvaluationTypeSelect';
import type { RangeProposalCriteria } from './components/ProposalRubricCriteriaInput';
import { ProposalRubricCriteriaInput } from './components/ProposalRubricCriteriaInput';
import { ProposalStepper } from './components/ProposalStepper/ProposalStepper';
import { ProposalStepSummary } from './components/ProposalStepSummary';
import { ProposalTemplateSelect } from './components/ProposalTemplateSelect';
import type { FormInput as EvaluationFormValues } from './components/RubricEvaluationForm';
import { RubricEvaluationForm } from './components/RubricEvaluationForm';

export type ProposalFormInputs = {
  title?: string; // title is saved to the same state that's used in ProposalPage
  content?: PageContent | null;
  contentText?: string;
  // id?: string;
  categoryId?: string | null;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  proposalTemplateId?: string | null;
  evaluationType: ProposalEvaluationType;
  rubricCriteria: RangeProposalCriteria[];
};

type ProposalPropertiesProps = {
  archived?: boolean;
  canAnswerRubric?: boolean;
  canViewRubricAnswers?: boolean;
  disabledCategoryInput?: boolean;
  onChangeRubricCriteria: (criteria: RangeProposalCriteria[]) => void;
  pageId?: string;
  proposalId?: string;
  proposalFlowFlags?: ProposalFlowPermissionFlags;
  proposalFormInputs: ProposalFormInputs;
  proposalStatus?: ProposalStatus;
  readOnlyAuthors?: boolean;
  readOnlyReviewers?: boolean;
  readOnlyProposalEvaluationType?: boolean;
  readOnlyRubricCriteria?: boolean;
  rubricAnswers?: ProposalRubricCriteriaAnswerWithTypedResponse[];
  rubricCriteria?: ProposalRubricCriteria[];
  setProposalFormInputs: (values: ProposalFormInputs) => void;
  showStatus?: boolean;
  snapshotProposalId?: string | null;
  userId?: string;
  updateProposalStatus?: (newStatus: ProposalStatus) => Promise<void>;
};

export function ProposalProperties({
  archived,
  canAnswerRubric,
  canViewRubricAnswers,
  disabledCategoryInput,
  onChangeRubricCriteria,
  proposalFormInputs,
  pageId,
  proposalId,
  proposalFlowFlags,
  proposalStatus,
  readOnlyAuthors,
  readOnlyProposalEvaluationType,
  readOnlyReviewers,
  readOnlyRubricCriteria,
  rubricAnswers = [],
  rubricCriteria,
  setProposalFormInputs,
  showStatus,
  snapshotProposalId,
  userId,
  updateProposalStatus
}: ProposalPropertiesProps) {
  const showRubricFeature = useIsCharmverseSpace();

  const { proposalCategoriesWithCreatePermission, categories } = useProposalCategories();

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const { pages } = usePages();
  const [detailsExpanded, setDetailsExpanded] = useState(proposalStatus === 'draft');
  const prevStatusRef = useRef(proposalStatus || '');
  const [selectedProposalTemplateId, setSelectedProposalTemplateId] = useState<null | string>(null);

  const { proposalTemplates } = useProposalTemplates();

  const proposalTemplatePages = useMemo(() => {
    return Object.values(pages).filter((p) => p?.type === 'proposal_template') as PageMeta[];
  }, [pages]);

  const proposalCategoryId = proposalFormInputs.categoryId;
  const proposalCategory = categories?.find((category) => category.id === proposalCategoryId);
  const proposalAuthorIds = proposalFormInputs.authors;
  const proposalReviewers = proposalFormInputs.reviewers;
  const isNewProposal = !pageId;
  const voteProposal = proposalId && proposalStatus ? { id: proposalId, status: proposalStatus } : undefined;
  const myRubricAnswers = rubricAnswers.filter((answer) => answer.userId === userId);

  const proposalsRecord = (proposalTemplates ?? []).reduce((acc, _proposal) => {
    acc[_proposal.id] = _proposal;
    return acc;
  }, {} as Record<string, Proposal & { page: Page }>);

  const templateOptions = proposalTemplatePages.filter((proposalTemplate) => {
    const _proposal = proposalTemplate.proposalId && proposalsRecord[proposalTemplate.proposalId];
    if (!_proposal) {
      return false;
    } else if (!proposalCategoryId) {
      return true;
    }
    return _proposal.categoryId === proposalCategoryId;
  });

  const proposalTemplatePage = proposalFormInputs.proposalTemplateId
    ? pages[proposalFormInputs.proposalTemplateId]
    : null;

  async function onChangeCategory(updatedCategory: ProposalCategory | null) {
    if (updatedCategory && updatedCategory.id !== proposalFormInputs.categoryId) {
      setProposalFormInputs({
        ...proposalFormInputs,
        categoryId: updatedCategory.id,
        proposalTemplateId: null
      });
    } else if (!updatedCategory) {
      setProposalFormInputs({
        ...proposalFormInputs,
        categoryId: null,
        proposalTemplateId: null
      });
    }
  }

  function applyTemplate(templatePage: PageMeta) {
    if (templatePage && templatePage.proposalId) {
      // Fetch the proposal page to get its content
      const proposalTemplate = proposalTemplates?.find(
        (_proposalTemplate) => _proposalTemplate.page.id === templatePage.id
      );
      if (proposalTemplate) {
        setProposalFormInputs({
          ...proposalFormInputs,
          categoryId: proposalTemplate.categoryId,
          content: proposalTemplate.page.content as PageContent,
          contentText: proposalTemplate.page.contentText,
          reviewers: proposalTemplate.reviewers.map((reviewer) => ({
            group: reviewer.roleId ? 'role' : 'user',
            id: reviewer.roleId ?? (reviewer.userId as string)
          })),
          proposalTemplateId: templatePage.id
        });
      }
    }
  }

  function clearTemplate() {
    setProposalFormInputs({
      ...proposalFormInputs,
      proposalTemplateId: null
    });
  }

  function openVoteModal() {
    setIsVoteModalOpen(true);
  }

  function onSubmitEvaluation(results: EvaluationFormValues) {
    // console.log('submit form', results);
    if (proposalId) {
      charmClient.proposals.upsertRubricCriteriaAnswer({
        proposalId,
        // @ts-ignore -  TODO: make answer types match
        answers: results.answers
      });
    }
  }

  useEffect(() => {
    if (!prevStatusRef.current && proposalStatus === 'draft') {
      setDetailsExpanded(true);
    }

    prevStatusRef.current = proposalStatus || '';
  }, [detailsExpanded, proposalStatus]);

  const evaluationTabs = useMemo<TabConfig[]>(() => {
    if (proposalStatus !== 'evaluation_active' && proposalStatus !== 'evaluation_closed') {
      return [];
    }
    const tabs = [
      canAnswerRubric &&
        ([
          'Evaluate',
          <LoadingComponent key='evaluate' isLoading={!rubricCriteria}>
            <RubricEvaluationForm
              answers={myRubricAnswers}
              criteriaList={rubricCriteria!}
              onSubmit={onSubmitEvaluation}
            />
          </LoadingComponent>
        ] as TabConfig),
      canViewRubricAnswers &&
        ([
          'Results',
          <LoadingComponent key='results' isLoading={!rubricCriteria}>
            <RubricResults answers={rubricAnswers} criteriaList={rubricCriteria || []} reviewers={proposalReviewers} />
          </LoadingComponent>,
          { sx: { p: 0 } }
        ] as TabConfig)
    ].filter(isTruthy);
    return tabs;
  }, [canAnswerRubric, canViewRubricAnswers, myRubricAnswers, rubricCriteria]);

  return (
    <Box
      className='CardDetail content'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        },
        '.octo-propertyname .Button': {
          paddingLeft: 0
        }
      }}
      mt={2}
    >
      <div className='octo-propertylist'>
        {showStatus && (
          <>
            <Grid container mb={2}>
              <ProposalStepSummary
                archived={archived}
                proposalFlowFlags={proposalFlowFlags}
                proposalStatus={proposalStatus}
                openVoteModal={openVoteModal}
                updateProposalStatus={updateProposalStatus}
                evaluationType={proposalFormInputs.evaluationType}
              />
            </Grid>

            <Stack
              direction='row'
              gap={1}
              alignItems='center'
              sx={{ cursor: 'pointer' }}
              onClick={() => setDetailsExpanded((v) => !v)}
            >
              <Typography fontWeight='bold'>Details</Typography>
              <IconButton size='small'>
                <KeyboardArrowDown
                  fontSize='small'
                  sx={{ transform: `rotate(${detailsExpanded ? 180 : 0}deg)`, transition: 'all 0.2s ease' }}
                />
              </IconButton>
            </Stack>
          </>
        )}
        <Collapse in={detailsExpanded} timeout='auto' unmountOnExit>
          {showStatus && (
            <Box mt={2} mb={2}>
              <ProposalStepper
                proposalFlowPermissions={proposalFlowFlags}
                proposalStatus={proposalStatus}
                openVoteModal={openVoteModal}
                updateProposalStatus={updateProposalStatus}
                evaluationType={proposalFormInputs.evaluationType}
              />
            </Box>
          )}

          {/* Select a category */}
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly>Category</PropertyLabel>
              <Box display='flex' flex={1}>
                <ProposalCategorySelect
                  disabled={disabledCategoryInput}
                  options={proposalCategoriesWithCreatePermission || []}
                  value={proposalCategory ?? null}
                  onChange={onChangeCategory}
                />
              </Box>
            </Box>
          </Box>

          {/* Select a template */}
          {isNewProposal && (
            <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly>Template</PropertyLabel>
                <Box display='flex' flex={1}>
                  <ProposalTemplateSelect
                    options={templateOptions}
                    value={proposalTemplatePage ?? null}
                    onChange={(template) => {
                      if (template === null) {
                        clearTemplate();
                        // if user has not updated the content, then just overwrite everything
                      } else if (proposalFormInputs.contentText?.length === 0) {
                        applyTemplate(template);
                      } else {
                        // set value to trigger a prompt
                        setSelectedProposalTemplateId(template?.id ?? null);
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Select authors */}
          <Box justifyContent='space-between' gap={2} alignItems='center'>
            <div
              className='octo-propertyrow'
              style={{
                display: 'flex',
                height: 'fit-content',
                flexGrow: 1
              }}
            >
              <PropertyLabel readOnly>Author</PropertyLabel>
              <Box display='flex' flex={1}>
                <UserSelect
                  memberIds={proposalAuthorIds}
                  readOnly={readOnlyAuthors}
                  onChange={(authors) => {
                    setProposalFormInputs({
                      ...proposalFormInputs,
                      authors
                    });
                  }}
                  wrapColumn
                  showEmptyPlaceholder
                />
              </Box>
            </div>
          </Box>
          {/* Select reviewers */}
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly>Reviewer</PropertyLabel>
              <UserAndRoleSelect
                readOnly={readOnlyReviewers}
                value={proposalReviewers}
                onChange={(options) => {
                  setProposalFormInputs({
                    ...proposalFormInputs,
                    reviewers: options.map((option) => ({ group: option.group, id: option.id }))
                  });
                }}
              />
            </Box>
          </Box>
          {/* Select valuation type */}
          {showRubricFeature && (
            <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly>Type</PropertyLabel>
                <ProposalEvaluationTypeSelect
                  disabled={readOnlyProposalEvaluationType}
                  value={proposalFormInputs.evaluationType}
                  onChange={(evaluationType) => {
                    setProposalFormInputs({
                      ...proposalFormInputs,
                      evaluationType
                    });
                  }}
                />
              </Box>
            </Box>
          )}
          {/* Select rubric criteria */}

          {proposalFormInputs.evaluationType === 'rubric' && (
            <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly>&nbsp;</PropertyLabel>
                <Box display='flex' flex={1} flexDirection='column'>
                  <ProposalRubricCriteriaInput
                    readOnly={readOnlyRubricCriteria}
                    value={proposalFormInputs.rubricCriteria}
                    onChange={onChangeRubricCriteria}
                    proposalStatus={proposalStatus}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Collapse>
        <Divider
          sx={{
            my: 2
          }}
        />

        {evaluationTabs.length > 0 && (
          <Card variant='outlined' sx={{ my: 2 }}>
            <MultiTabs tabs={evaluationTabs} />
          </Card>
        )}

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
            const templatePage = proposalTemplatePages.find((template) => template.id === selectedProposalTemplateId);
            if (templatePage) {
              applyTemplate(templatePage);
            }
            setSelectedProposalTemplateId(null);
          }}
        />
        <CreateVoteModal
          proposalFlowFlags={proposalFlowFlags}
          proposal={voteProposal}
          pageId={pageId}
          snapshotProposalId={snapshotProposalId || null}
          open={isVoteModalOpen}
          onCreateVote={() => {
            setIsVoteModalOpen(false);
            updateProposalStatus?.('vote_active');
          }}
          onPublishToSnapshot={() => {
            setIsVoteModalOpen(false);
            updateProposalStatus?.('vote_active');
          }}
          onClose={() => {
            setIsVoteModalOpen?.(false);
          }}
        />
      </div>
    </Box>
  );
}
