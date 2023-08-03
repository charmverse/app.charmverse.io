import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { Page, Proposal, ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalReviewerInput } from '@charmverse/core/proposals';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Collapse, Divider, Grid, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { InputSearchMemberBase } from 'components/common/form/InputSearchMember';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { CreateVoteModal } from 'components/votes/components/CreateVoteModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useRoles } from 'hooks/useRoles';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';
import type { ProposalCategory } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import type { PageContent } from 'lib/prosemirror/interfaces';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

import { useProposalCategories } from '../../hooks/useProposalCategories';

import { InputSearchReviewers } from './components/InputSearchReviewers';
import { ProposalCategoryInput } from './components/ProposalCategoryInput';
import { ProposalStepper } from './components/ProposalStepper/ProposalStepper';
import { ProposalStepSummary } from './components/ProposalStepSummary';
import { ProposalTemplateInput } from './components/ProposalTemplateInput';

export type ProposalFormInputs = {
  title?: string; // title is saved to the same state that's used in ProposalPage
  content?: PageContent | null;
  contentText?: string;
  // id?: string;
  categoryId?: string | null;
  authors: string[];
  reviewers: ProposalReviewerInput[];
  proposalTemplateId?: string | null;
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
  const { members } = useMembers();
  const { roles = [] } = useRoles();
  const { user } = useUser();
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
  const isProposalAuthor = user && proposalAuthorIds.some((authorId) => authorId === user.id);
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

  const isProposalReviewer =
    user &&
    proposalReviewers.some((reviewer) => {
      if (reviewer.group === 'user') {
        return reviewer.id === user.id;
      }
      return user.spaceRoles.some((spaceRole) =>
        spaceRole.spaceRoleToRole.some(({ roleId }) => roleId === reviewer.id)
      );
    });

  const reviewerOptionsRecord: Record<
    string,
    ({ group: 'role' } & ListSpaceRolesResponse) | ({ group: 'user' } & Member)
  > = {};

  const currentUserGroups: ProposalUserGroup[] = [];
  if (isProposalAuthor) {
    currentUserGroups.push('author');
  }

  if (isProposalReviewer) {
    currentUserGroups.push('reviewer');
  }

  members.forEach((member) => {
    reviewerOptionsRecord[member.id] = {
      ...member,
      group: 'user'
    };
  });

  (roles ?? []).forEach((role) => {
    reviewerOptionsRecord[role.id] = {
      ...role,
      group: 'role'
    };
  });

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
              gap={4}
              alignItems='center'
              sx={{ cursor: 'pointer' }}
              onClick={() => setDetailsExpanded((v) => !v)}
            >
              <Typography variant='subtitle1'>Details</Typography>
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
          <Grid container mb={2}>
            <Typography variant='subtitle1'>Properties</Typography>
          </Grid>

          {/* Select a category */}
          <Box justifyContent='space-between' gap={2} alignItems='center' my='6px'>
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly>Category</PropertyLabel>
              <Box display='flex' flex={1}>
                <ProposalCategoryInput
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
            <Box justifyContent='space-between' gap={2} alignItems='center' my='6px'>
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly>Template</PropertyLabel>
                <Box display='flex' flex={1}>
                  <ProposalTemplateInput
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
              <div style={{ width: '100%' }}>
                <InputSearchMemberBase
                  filterSelectedOptions
                  multiple
                  placeholder='Select authors'
                  value={members.filter((member) => proposalAuthorIds.some((authorId) => member.id === authorId))}
                  disableCloseOnSelect
                  onChange={async (_, _members) => {
                    // Must have atleast one author of proposal
                    if ((_members as Member[]).length !== 0) {
                      setProposalFormInputs({
                        ...proposalFormInputs,
                        authors: (_members as Member[]).map((member) => member.id)
                      });
                    }
                  }}
                  disabled={readOnly}
                  readOnly={readOnly || canUpdateProposalProperties === false}
                  options={members}
                  sx={{
                    width: '100%'
                  }}
                />
              </div>
            </div>
          </Box>
          <Box justifyContent='space-between' gap={2} alignItems='center'>
            <div
              className='octo-propertyrow'
              style={{
                display: 'flex',
                height: 'fit-content',
                flexGrow: 1
              }}
            >
              <PropertyLabel readOnly>Reviewer</PropertyLabel>
              <div style={{ width: '100%' }}>
                <InputSearchReviewers
                  disabled={readOnly}
                  readOnly={readOnly || canUpdateProposalProperties === false}
                  value={proposalReviewers.map((reviewer) => reviewerOptionsRecord[reviewer.id])}
                  disableCloseOnSelect
                  excludedIds={proposalReviewers.map((reviewer) => reviewer.id)}
                  onChange={async (e, options) => {
                    setProposalFormInputs({
                      ...proposalFormInputs,
                      reviewers: options.map((option) => ({ group: option.group, id: option.id }))
                    });
                  }}
                  sx={{
                    width: '100%'
                  }}
                />
              </div>
            </div>
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
