import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { Page, Proposal, ProposalStatus, ProposalEvaluationType } from '@charmverse/core/prisma';
import type { ProposalReviewerInput } from '@charmverse/core/proposals';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Collapse, Divider, Grid, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { CreateVoteModal } from 'components/votes/components/CreateVoteModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { ProposalCategory } from 'lib/proposal/interface';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { useProposalCategories } from '../../hooks/useProposalCategories';

import { ProposalCategorySelect } from './components/ProposalCategorySelect';
import { ProposalEvaluationTypeSelect } from './components/ProposalEvaluationTypeSelect';
import type { RangeProposalCriteria } from './components/ProposalRubricCriteriaInput';
import { ProposalRubricCriteriaInput } from './components/ProposalRubricCriteriaInput';
import { ProposalStepper } from './components/ProposalStepper/ProposalStepper';
import { ProposalStepSummary } from './components/ProposalStepSummary';
import { ProposalTemplateSelect } from './components/ProposalTemplateSelect';

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

interface ProposalPropertiesProps {
  archived?: boolean;
  canUpdateProposalProperties?: boolean;
  disabledCategoryInput?: boolean;
  isTemplate: boolean;
  pageId?: string;
  proposalId?: string;
  proposalFlowFlags?: ProposalFlowPermissionFlags;
  proposalFormInputs: ProposalFormInputs;
  proposalStatus?: ProposalStatus;
  readOnly?: boolean;
  setProposalFormInputs: (values: ProposalFormInputs) => void;
  snapshotProposalId?: string | null;
  updateProposalStatus?: (newStatus: ProposalStatus) => Promise<void>;
}

export function ProposalProperties({
  archived,
  canUpdateProposalProperties,
  disabledCategoryInput,
  isTemplate,
  proposalFormInputs,
  pageId,
  proposalId,
  proposalFlowFlags,
  proposalStatus,
  readOnly,
  setProposalFormInputs,
  snapshotProposalId,
  updateProposalStatus
}: ProposalPropertiesProps) {
  const { categories } = useProposalCategories();

  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const { pages } = usePages();
  const { space: currentSpace } = useCurrentSpace();
  const [detailsExpanded, setDetailsExpanded] = useState(proposalStatus === 'draft');
  const prevStatusRef = useRef(proposalStatus || '');
  const [selectedProposalTemplateId, setSelectedProposalTemplateId] = useState<null | string>(null);
  const { data: proposalTemplates = [] } = useSWR(
    () => (currentSpace ? `proposals-templates/${currentSpace.id}` : null),
    () => charmClient.proposals.getProposalTemplatesBySpace({ spaceId: currentSpace!.id })
  );

  const proposalTemplatePages = useMemo(() => {
    return Object.values(pages).filter((p) => p?.type === 'proposal_template') as PageMeta[];
  }, [pages]);

  const proposalCategoryId = proposalFormInputs.categoryId;
  const proposalCategory = categories?.find((category) => category.id === proposalCategoryId);
  const proposalAuthorIds = proposalFormInputs.authors;
  const proposalReviewers = proposalFormInputs.reviewers;
  const isNewProposal = !pageId;
  const voteProposal = proposalId && proposalStatus ? { id: proposalId, status: proposalStatus } : undefined;

  const proposalsRecord = proposalTemplates.reduce((acc, _proposal) => {
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
      const proposalTemplate = proposalTemplates.find(
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

  useEffect(() => {
    if (!prevStatusRef.current && proposalStatus === 'draft') {
      setDetailsExpanded(true);
    }

    prevStatusRef.current = proposalStatus || '';
  }, [detailsExpanded, proposalStatus]);
  return (
    <Box
      className='CardDetail content'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        }
      }}
      mt={2}
    >
      <div className='octo-propertylist'>
        {!isTemplate && (
          <>
            <Grid container mb={2}>
              <ProposalStepSummary
                archived={archived}
                proposalFlowFlags={proposalFlowFlags}
                proposalStatus={proposalStatus}
                openVoteModal={openVoteModal}
                updateProposalStatus={updateProposalStatus}
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
          {!isTemplate && (
            <Grid container mb={2} mt={2}>
              <ProposalStepper
                proposalFlowPermissions={proposalFlowFlags}
                proposalStatus={proposalStatus}
                openVoteModal={openVoteModal}
                updateProposalStatus={updateProposalStatus}
              />
            </Grid>
          )}
          <Grid container mb={1}>
            <Typography variant='subtitle1'>Properties</Typography>
          </Grid>

          {/* Select a category */}
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly>Category</PropertyLabel>
              <Box display='flex' flex={1}>
                <ProposalCategorySelect
                  disabled={disabledCategoryInput}
                  options={categories || []}
                  value={proposalCategory ?? null}
                  onChange={onChangeCategory}
                />
              </Box>
            </Box>
          </Box>

          {/* Select a template */}
          {!isTemplate && isNewProposal && (
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
                  readOnly={readOnly || canUpdateProposalProperties === false}
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
                readOnly={readOnly || canUpdateProposalProperties === false}
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
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly>Type</PropertyLabel>
              <Box display='flex' flex={1} flexDirection='column'>
                <ProposalEvaluationTypeSelect
                  value={proposalFormInputs.evaluationType}
                  onChange={(evaluationType) => {
                    setProposalFormInputs({
                      ...proposalFormInputs,
                      evaluationType
                    });
                  }}
                />
                {proposalFormInputs.evaluationType === 'rubric' && (
                  <ProposalRubricCriteriaInput value={proposalFormInputs.rubricCriteria} onChange={() => {}} />
                )}
              </Box>
            </Box>
          </Box>
        </Collapse>

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
        <Divider
          sx={{
            my: 2
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
