import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Divider, Grid, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { InputSearchContributorBase } from 'components/common/form/InputSearchContributor';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import PublishToSnapshot from 'components/common/PageLayout/components/Header/components/Snapshot/PublishToSnapshot';
import UserDisplay from 'components/common/UserDisplay';
import ProposalCategoryInput from 'components/proposals/components/ProposalCategoryInput';
import ProposalStepper from 'components/proposals/components/ProposalStepper';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import type { Contributor } from 'hooks/useContributors';
import { useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';
import { useUser } from 'hooks/useUser';
import type { ProposalCategory } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ListSpaceRolesResponse } from 'pages/api/roles';
import useSWR from 'swr';

interface ProposalPropertiesProps {
  readOnly?: boolean
  pageId: string
  proposalId: string
  isTemplate: boolean
}

export default function ProposalProperties ({ pageId, proposalId, readOnly, isTemplate }: ProposalPropertiesProps) {
  const { data: proposal, mutate: refreshProposal } = useSWR(`proposal/${proposalId}`, () => charmClient.proposals.getProposal(proposalId));
  const { categories, canEditProposalCategories, addCategory, deleteCategory } = useProposalCategories();

  const [contributors] = useContributors();
  const { roles = [], roleups } = useRoles();
  const { user } = useUser();

  const proposalMenuState = usePopupState({ popupId: 'proposal-info', variant: 'popover' });

  const proposalReviewer = contributors?.find(contributor => contributor.id === proposal?.reviewedBy);

  if (!proposal) {
    return !isTemplate ? (
      <Grid container mt={2} mb={2}>
        <ProposalStepper
          proposalUserGroups={[]}
          refreshProposal={refreshProposal}
        />
      </Grid>
    ) : null;
  }

  const { status, category } = proposal;

  const isProposalAuthor = (user && proposal.authors.some(author => author.userId === user.id));

  const isProposalReviewer = (user && (proposal.reviewers.some(reviewer => {
    if (reviewer.userId) {
      return reviewer.userId === user.id;
    }
    return roleups.some(role => role.id === reviewer.roleId && role.users.some(_user => _user.id === user.id));
  })));

  const canUpdateProposalProperties = (status === 'draft' || status === 'private_draft' || status === 'discussion') && isProposalAuthor;

  const reviewerOptionsRecord: Record<string, ({group: 'role'} & ListSpaceRolesResponse) | ({group: 'user'} & Contributor)> = {};

  const currentUserGroups: ProposalUserGroup[] = [];
  if (isProposalAuthor) {
    currentUserGroups.push('author');
  }

  if (isProposalReviewer) {
    currentUserGroups.push('reviewer');
  }

  contributors.forEach(contributor => {
    reviewerOptionsRecord[contributor.id] = {
      ...contributor,
      group: 'user'
    };
  });

  roles.forEach(role => {
    reviewerOptionsRecord[role.id] = {
      ...role,
      group: 'role'
    };
  });

  async function onChangeCategory (updatedCategory: ProposalCategory | null) {
    if (!proposal) {
      return;
    }

    await charmClient.proposals.updateProposal({
      proposalId: proposal.id,
      authors: proposal.authors.map(author => author.userId),
      reviewers: proposal.reviewers.map(reviewer => ({ group: reviewer.roleId ? 'role' : 'user', id: reviewer.roleId ?? reviewer.userId as string })),
      categoryId: updatedCategory?.id || null
    });

    refreshProposal();
  }

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
      {
        !isTemplate && (
          <Grid container mb={2}>
            <ProposalStepper
              proposalUserGroups={currentUserGroups}
              proposal={proposal}
              refreshProposal={refreshProposal}
            />
          </Grid>
        )
      }
      <Grid container mb={2}>
        <Grid item xs={8}>
          <Box display='flex' gap={1} alignItems='center'>
            <Typography fontWeight='bold'>Proposal information</Typography>
            {proposal.status === 'reviewed' && (
              <IconButton size='small' {...bindTrigger(proposalMenuState)}>
                <MoreHorizIcon fontSize='small' />
              </IconButton>
            )}
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
              disabled={readOnly || !canUpdateProposalProperties}
              options={categories || []}
              canEditCategories={canEditProposalCategories}
              value={category}
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
            <InputSearchContributorBase
              filterSelectedOptions
              multiple
              placeholder='Select authors'
              value={contributors.filter(contributor => proposal.authors.find(author => contributor.id === author.userId))}
              disableCloseOnSelect
              onChange={async (_, _contributors) => {
                // Must have atleast one author of proposal
                if ((_contributors as Contributor[]).length !== 0) {
                  await charmClient.proposals.updateProposal({
                    proposalId: proposal.id,
                    authors: (_contributors as Contributor[]).map(contributor => contributor.id),
                    reviewers: proposal.reviewers.map(reviewer => ({ group: reviewer.roleId ? 'role' : 'user', id: reviewer.roleId ?? reviewer.userId as string }))
                  });
                  refreshProposal();
                }
              }}
              disabled={readOnly || !canUpdateProposalProperties}
              readOnly={readOnly}
              options={contributors}
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
            {
              proposal.status === 'reviewed' && proposalReviewer ? (
                <UserDisplay
                  user={proposalReviewer}
                  avatarSize='small'
                />
              ) : (
                <InputSearchReviewers
                  disabled={readOnly || !canUpdateProposalProperties}
                  readOnly={readOnly}
                  value={proposal.reviewers.map(reviewer => reviewerOptionsRecord[(reviewer.roleId ?? reviewer.userId) as string])}
                  disableCloseOnSelect={true}
                  excludedIds={proposal.reviewers.map(reviewer => (reviewer.roleId ?? reviewer.userId) as string)}
                  onChange={async (e, options) => {
                    await charmClient.proposals.updateProposal({
                      proposalId: proposal.id,
                      authors: proposal.authors.map(author => author.userId),
                      reviewers: options.map(option => ({ group: option.group, id: option.id }))
                    });
                    refreshProposal();
                  }}
                  sx={{
                    width: '100%'
                  }}
                />
              )
            }
          </div>
        </div>
      </Box>

      <Divider sx={{
        my: 2
      }}
      />
      <Menu {...bindMenu(proposalMenuState)}>
        {
          proposal.status === 'reviewed' && (
            <MenuItem disabled={!isProposalAuthor}>
              <PublishToSnapshot pageId={pageId} />
            </MenuItem>
          )
        }
      </Menu>
    </Box>
  );
}
