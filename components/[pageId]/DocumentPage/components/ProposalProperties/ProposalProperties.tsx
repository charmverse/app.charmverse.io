import { Divider, Grid, Menu, MenuItem, IconButton, Typography } from '@mui/material';
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { InputSearchContributorBase } from 'components/common/form/InputSearchContributor';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import { Contributor, useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';
import { useUser } from 'hooks/useUser';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { ListSpaceRolesResponse } from 'pages/api/roles';
import useSWR from 'swr';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { ProposalStatusChip } from './ProposalStatusBadge';

interface ProposalPropertiesProps {
  proposalId: string,
  readOnly?: boolean
}

export default function ProposalProperties ({ proposalId, readOnly }: ProposalPropertiesProps) {
  const { data: proposal, mutate: refreshProposal } = useSWR(`proposal/${proposalId}`, () => charmClient.proposals.getProposal(proposalId));

  const [contributors] = useContributors();
  const { roles = [] } = useRoles();
  const { user } = useUser();
  const proposalMenuState = usePopupState({ popupId: 'proposal-info', variant: 'popover' });

  if (!proposal) {
    return null;
  }

  const { status } = proposal;

  const canUpdateAuthors = status === 'draft' || status === 'private_draft' || status === 'discussion';
  const canUpdateReviewers = status === 'draft' || status === 'private_draft';
  const reviewerOptionsRecord: Record<string, ({group: 'role'} & ListSpaceRolesResponse) | ({group: 'user'} & Contributor)> = {};
  const isProposalAuthor = (user && proposal.authors.map(author => author.userId).includes(user.id));

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
      <Grid container mb={2}>
        <Grid item xs={8}>
          <Box display='flex' gap={1} alignItems='center'>
            <Typography fontWeight='bold'>Proposal information</Typography>
            <IconButton size='small' {...bindTrigger(proposalMenuState)}>
              <MoreHorizIcon fontSize='small' />
            </IconButton>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{
            justifyContent: 'flex-end',
            gap: 1,
            display: 'flex',
            alignItems: 'center'
          }}
          >

            <Box display='flex'>
              <ProposalStatusChip status={proposal.status} />
            </Box>
          </Box>
        </Grid>

      </Grid>

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
                  await charmClient.proposals.updateProposal(proposal.id, {
                    authors: (_contributors as Contributor[]).map(contributor => contributor.id),
                    reviewers: proposal.reviewers.map(reviewer => ({ group: reviewer.roleId ? 'role' : 'user', id: reviewer.roleId ?? reviewer.userId as string }))
                  });
                  refreshProposal();
                }
              }}
              disabled={!user || readOnly || !canUpdateAuthors || !isProposalAuthor}
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
            <InputSearchReviewers
              disabled={!user || readOnly || !canUpdateReviewers || (user && !proposal.authors.map(author => author.userId).includes(user.id))}
              readOnly={readOnly}
              value={proposal.reviewers.map(reviewer => reviewerOptionsRecord[(reviewer.roleId ?? reviewer.userId) as string])}
              disableCloseOnSelect={true}
              excludedIds={proposal.reviewers.map(reviewer => (reviewer.roleId ?? reviewer.userId) as string)}
              onChange={async (e, options) => {
                await charmClient.proposals.updateProposal(proposal.id, {
                  authors: proposal.authors.map(author => author.userId),
                  reviewers: options.map(option => ({ group: option.group, id: option.id }))
                });
                refreshProposal();
              }}
              sx={{
                width: '100%'
              }}
            />
          </div>
        </div>
      </Box>
      <Divider sx={{
        my: 2
      }}
      />
      <Menu {...bindMenu(proposalMenuState)}>
        <MenuItem
          disabled={!isProposalAuthor}
          onClick={async () => {
            await charmClient.proposals.updateStatus(proposal.id, proposal.status === 'private_draft' ? 'draft' : proposal.status === 'draft' ? 'private_draft' : 'draft');
            refreshProposal();
            proposalMenuState.close();
          }}
        >
          <Box display='flex' alignItems='center' gap={1}>
            {proposal.status === 'private_draft' ? (
              <>
                <ArrowForwardIcon fontSize='small' />
                <Typography>Move to public draft</Typography>
              </>
            ) : (
              <>
                <ArrowBackIcon fontSize='small' />
                <Typography>
                  Move to {proposal.status === 'draft' ? 'private' : 'public'} draft
                </Typography>
              </>
            )}
          </Box>
        </MenuItem>

        {(proposal.status === 'private_draft' || proposal.status === 'draft') && (
          <MenuItem
            disabled={!isProposalAuthor}
            onClick={async () => {
              await charmClient.proposals.updateStatus(proposal.id, (proposal.status === 'private_draft' || proposal.status === 'draft') ? 'discussion' : 'private_draft');
              refreshProposal();
              proposalMenuState.close();
            }}
          >
            <Box display='flex' alignItems='center' gap={1}>

              {proposal.status === 'draft' || proposal.status === 'private_draft' ? (
                <>
                  <ArrowForwardIcon fontSize='small' />
                  <Typography>
                    Move to discussion
                  </Typography>
                </>
              ) : (
                <>
                  <ArrowBackIcon fontSize='small' />
                  <Typography>
                    Move to private draft
                  </Typography>
                </>
              )}
            </Box>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
