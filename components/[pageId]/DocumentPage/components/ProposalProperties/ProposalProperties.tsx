import { KeyboardArrowDown } from '@mui/icons-material';
import { Divider, Grid, Typography, Box, Collapse, Stack, IconButton } from '@mui/material';
import type { ProposalStatus } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { InputSearchMemberBase } from 'components/common/form/InputSearchMember';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import UserDisplay from 'components/common/UserDisplay';
import useTasks from 'components/nexus/hooks/useTasks';
import ProposalCategoryInput from 'components/proposals/components/ProposalCategoryInput';
import ProposalStepper from 'components/proposals/components/ProposalStepper';
import { ProposalStepSummary } from 'components/proposals/components/ProposalStepSummary';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import CreateVoteModal from 'components/votes/components/CreateVoteModal';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import useRoles from 'hooks/useRoles';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';
import type { ProposalCategory } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

interface ProposalPropertiesProps {
  readOnly?: boolean;
  pageId: string;
  proposalId: string;
  isTemplate: boolean;
}

export default function ProposalProperties({ pageId, proposalId, readOnly, isTemplate }: ProposalPropertiesProps) {
  const { data: proposal, mutate: refreshProposal } = useSWR(`proposal/${proposalId}`, () =>
    charmClient.proposals.getProposal(proposalId)
  );

  const { categories, canEditProposalCategories, addCategory, deleteCategory } = useProposalCategories();
  const { mutate: mutateTasks } = useTasks();
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  const { members } = useMembers();
  const { roles = [], roleups } = useRoles();
  const { user } = useUser();
  const isAdmin = useIsAdmin();

  const prevStatusRef = useRef(proposal?.status || '');
  const [detailsExpanded, setDetailsExpanded] = useState(['private_draft', 'draft'].includes(proposal?.status ?? ''));

  const proposalStatus = proposal?.status;
  const proposalCategory = proposal?.category;
  const proposalAuthors = proposal?.authors ?? [];
  const proposalReviewers = proposal?.reviewers ?? [];
  const proposalReviewerId = proposal?.reviewedBy;

  const proposalReviewer = members?.find((member) => member.id === proposalReviewerId);

  const isProposalAuthor = user && proposalAuthors.some((author) => author.userId === user.id);

  useEffect(() => {
    if (proposal?.status === 'vote_active' && detailsExpanded) {
      setDetailsExpanded(false);
    }

    if (!prevStatusRef.current && ['private_draft', 'draft'].includes(proposal?.status || '')) {
      setDetailsExpanded(true);
    }

    prevStatusRef.current = proposal?.status || '';
  }, [detailsExpanded, proposal?.status]);

  const isProposalReviewer =
    user &&
    proposalReviewers.some((reviewer) => {
      if (reviewer.userId) {
        return reviewer.userId === user.id;
      }
      return roleups.some((role) => role.id === reviewer.roleId && role.users.some((_user) => _user.id === user.id));
    });

  const canUpdateProposalProperties =
    (proposalStatus === 'draft' || proposalStatus === 'private_draft' || proposalStatus === 'discussion') &&
    (isProposalAuthor || isAdmin);

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
    if (!proposal) {
      return;
    }

    await charmClient.proposals.updateProposal({
      proposalId: proposal.id,
      authors: proposal.authors.map((author) => author.userId),
      reviewers: proposalReviewers.map((reviewer) => ({
        group: reviewer.roleId ? 'role' : 'user',
        id: reviewer.roleId ?? (reviewer.userId as string)
      })),
      categoryId: updatedCategory?.id || null
    });

    refreshProposal();
  }

  async function updateProposalStatus(newStatus: ProposalStatus) {
    if (proposal && newStatus !== proposal.status) {
      await charmClient.proposals.updateStatus(proposal.id, newStatus);
      await refreshProposal();
      mutateTasks();
    }
  }

  const openVoteModal = () => {
    setIsVoteModalOpen(true);
  };

  return (
    <Box
      className='octo-propertylist'
      sx={{
        '& .MuiInputBase-input': {
          background: 'none'
        }
      }}
      mt={2}
    >
      {!isTemplate && (
        <>
          <Grid container mb={2}>
            <ProposalStepSummary
              proposalUserGroups={isAdmin ? ['author', 'reviewer'] : currentUserGroups}
              proposal={proposal}
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
            <Typography variant='subtitle1'>Additional information</Typography>
            <IconButton size='small'>
              <KeyboardArrowDown
                fontSize='small'
                sx={{ transform: `rotate(${detailsExpanded ? 180 : 0}deg)`, transition: 'all 0.2s ease' }}
              />
            </IconButton>
          </Stack>
        </>
      )}

      <Collapse in={isTemplate ? true : detailsExpanded} timeout='auto' unmountOnExit>
        {!isTemplate && (
          <Grid container mb={2} mt={2}>
            <ProposalStepper
              proposalUserGroups={isAdmin ? ['author', 'reviewer'] : currentUserGroups}
              proposal={proposal}
              openVoteModal={openVoteModal}
              updateProposalStatus={updateProposalStatus}
            />
          </Grid>
        )}

        <Grid container mb={2}>
          <Grid item xs={8}>
            <Box display='flex' gap={1} alignItems='center'>
              <Typography fontWeight='bold'>Proposal information</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box justifyContent='space-between' gap={2} alignItems='center' my='6px'>
          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <div className='octo-propertyname octo-propertyname--readonly'>
              <Button>Category</Button>
            </div>
            <Box display='flex' flex={1}>
              <ProposalCategoryInput
                disabled={readOnly || !canUpdateProposalProperties || !proposal}
                options={categories || []}
                canEditCategories={canEditProposalCategories}
                value={proposalCategory ?? null}
                onChange={onChangeCategory}
                onDeleteCategory={deleteCategory}
                onAddCategory={addCategory}
              />
            </Box>
          </Box>
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
            <div className='octo-propertyname octo-propertyname--readonly'>
              <Button>Author</Button>
            </div>
            <div style={{ width: '100%' }}>
              <InputSearchMemberBase
                filterSelectedOptions
                multiple
                placeholder='Select authors'
                value={members.filter((member) => proposalAuthors.find((author) => member.id === author.userId))}
                disableCloseOnSelect
                onChange={async (_, _members) => {
                  // Must have atleast one author of proposal
                  if ((_members as Member[]).length !== 0) {
                    await charmClient.proposals.updateProposal({
                      proposalId,
                      authors: (_members as Member[]).map((member) => member.id),
                      reviewers: proposalReviewers.map((reviewer) => ({
                        group: reviewer.roleId ? 'role' : 'user',
                        id: reviewer.roleId ?? (reviewer.userId as string)
                      }))
                    });
                    refreshProposal();
                  }
                }}
                disabled={readOnly || !canUpdateProposalProperties || !proposal}
                readOnly={readOnly}
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
            <div className='octo-propertyname octo-propertyname--readonly'>
              <Button>Reviewer</Button>
            </div>
            <div style={{ width: '100%' }}>
              {proposalStatus === 'reviewed' && proposalReviewer ? (
                <UserDisplay showMiniProfile user={proposalReviewer} avatarSize='small' />
              ) : (
                <InputSearchReviewers
                  disabled={readOnly || !canUpdateProposalProperties}
                  readOnly={readOnly}
                  value={proposalReviewers.map(
                    (reviewer) => reviewerOptionsRecord[(reviewer.roleId ?? reviewer.userId) as string]
                  )}
                  disableCloseOnSelect={true}
                  excludedIds={proposalReviewers.map((reviewer) => (reviewer.roleId ?? reviewer.userId) as string)}
                  onChange={async (e, options) => {
                    await charmClient.proposals.updateProposal({
                      proposalId,
                      authors: proposalAuthors.map((author) => author.userId),
                      reviewers: options.map((option) => ({ group: option.group, id: option.id }))
                    });
                    refreshProposal();
                  }}
                  sx={{
                    width: '100%'
                  }}
                />
              )}
            </div>
          </div>
        </Box>
      </Collapse>

      <Divider
        sx={{
          my: 2
        }}
      />

      <CreateVoteModal
        proposal={proposal}
        open={isVoteModalOpen}
        onCreateVote={() => {
          setIsVoteModalOpen(false);
          updateProposalStatus('vote_active');
        }}
        onPublishToSnapshot={() => {
          setIsVoteModalOpen(false);
          updateProposalStatus('vote_active');
        }}
        onClose={() => {
          setIsVoteModalOpen(false);
        }}
      />
    </Box>
  );
}
