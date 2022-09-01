import { Divider, Grid, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { InputSearchContributorBase } from 'components/common/form/InputSearchContributor';
import InputSearchReviewers from 'components/common/form/InputSearchReviewers';
import { Contributor, useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';
import { ListSpaceRolesResponse } from 'pages/api/roles';
import useSWR from 'swr';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ProposalStatusChip } from './ProposalStatusBadge';

interface ProposalPropertiesProps {
  proposalId: string,
  readOnly?: boolean
}

export default function ProposalProperties ({ proposalId, readOnly }: ProposalPropertiesProps) {
  const { data: proposal, mutate: refreshProposal } = useSWR(`proposal/${proposalId}`, () => charmClient.proposals.getProposal(proposalId));

  const [contributors] = useContributors();
  const { roles = [] } = useRoles();
  const proposalMenuState = usePopupState({ popupId: 'proposal-info', variant: 'popover' });

  if (!proposal) {
    return null;
  }

  const { status } = proposal;

  const canUpdateAuthors = status === 'draft' || status === 'private_draft' || status === 'discussion';
  const canUpdateReviewers = status === 'draft' || status === 'private_draft';
  const reviewerOptionsRecord: Record<string, ({group: 'role'} & ListSpaceRolesResponse) | ({group: 'user'} & Contributor)> = {};

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
                    reviewers: proposal.reviewers.map(reviewer => ({ group: reviewer.group, id: (reviewer.group === 'role' ? reviewer.roleId : reviewer.userId) as string }))
                  });
                  refreshProposal();
                }
              }}
              disabled={readOnly || !canUpdateAuthors}
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
              disabled={readOnly || !canUpdateReviewers}
              readOnly={readOnly}
              value={proposal.reviewers.map(reviewer => reviewerOptionsRecord[(reviewer.group === 'role' ? reviewer.roleId : reviewer.userId) as string])}
              disableCloseOnSelect={true}
              excludedIds={proposal.reviewers.map(reviewer => (reviewer.group === 'role' ? reviewer.roleId : reviewer.userId) as string)}
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
          onClick={async () => {
            if (proposal.status === 'private_draft') {
              await charmClient.proposals.publishDraft(proposal.id);
            }
            else if (proposal.status === 'draft') {
              await charmClient.proposals.openDiscussion(proposal.id);
            }
            refreshProposal();
            proposalMenuState.close();
          }}
        >
          <Box display='flex' alignItems='center' gap={1}>
            <ArrowForwardIcon fontSize='small' />
            <Typography>
              {proposal.status === 'private_draft' ? 'Publish draft' : 'Open discussion'}
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
}
