import { useTheme } from '@emotion/react';
import CheckIcon from '@mui/icons-material/Check';
import { Button, Divider, Grid, MenuItem, Select, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { ProposalStatus } from '@prisma/client';
import charmClient from 'charmClient';
import useTasks from 'components/nexus/hooks/useTasks';
import CreateVoteModal from 'components/votes/components/CreateVoteModal';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import { proposalStatusTransitionPermission, proposalStatusTransitionRecord, PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import { Fragment, useState } from 'react';
import type { KeyedMutator } from 'swr';

const proposalStatuses = Object.keys(proposalStatusTransitionRecord) as ProposalStatus[];

const proposalStatusTooltips: Record<ProposalStatus, string> = {
  private_draft: 'Only authors can view and edit this proposal',
  draft: 'Authors can edit and Workspace member can view this proposal ',
  discussion: 'Workspace members can comment on this proposal',
  review: 'Reviewers can approve this proposal',
  reviewed: 'Authors can move this proposal to vote',
  vote_active: 'Workspace members are voting on this proposal',
  vote_closed: 'The vote is complete'
};

export default function ProposalStepper (
  { refreshProposal, proposal, proposalUserGroups }:
  { refreshProposal: KeyedMutator<ProposalWithUsers>, proposalUserGroups: ProposalUserGroup[], proposal?: ProposalWithUsers}
) {
  const { status: currentStatus, id: proposalId, reviewers } = proposal ?? {
    status: null,
    id: null,
    reviewers: []
  };

  const theme = useTheme();
  const { mutate: mutateTasks } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentStatusIndex = currentStatus ? proposalStatuses.indexOf(currentStatus) : -1;

  async function updateProposalStatus (newStatus: ProposalStatus) {
    if (newStatus !== currentStatus && proposalId) {
      await charmClient.proposals.updateStatus(proposalId, newStatus);
      await refreshProposal();
      mutateTasks();
    }
  }

  function openVoteModal () {
    setIsModalOpen(true);
  }

  const stepperDimension = 25;

  return (
    <>
      <Grid
        container
        sx={{
          display: {
            xs: 'none',
            md: 'flex'
          }
        }}
      >
        {proposalStatuses.map((status, statusIndex) => {
          const canChangeStatus = currentStatus ? (currentStatus === 'discussion' && status === 'review' ? reviewers.length !== 0 : true) && (proposalUserGroups.some(
            proposalUserGroup => proposalStatusTransitionPermission[currentStatus]?.[proposalUserGroup]?.includes(status)
          )) : false;

          return (
            <Fragment key={status}>
              <Grid item md={12 / 13} display='flex' position='relative' alignItems='center' justifyContent='center'>
                <Stack
                  alignItems='center'
                  height='100%'
                  gap={1}
                >
                  <Box
                    sx={{
                      width: stepperDimension,
                      height: stepperDimension,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: canChangeStatus ? 'pointer' : 'initial',
                      background: status === currentStatus
                        ? theme.palette.purple.main : canChangeStatus
                          ? theme.palette.teal.main : theme.palette.gray.main
                    }}
                    onClick={() => {
                      if (canChangeStatus) {
                        if (status === 'vote_active') {
                          openVoteModal();
                        }
                        else {
                          updateProposalStatus(status);
                        }
                      }
                    }}
                  >
                    {currentStatusIndex >= statusIndex ? <CheckIcon fontSize='small' />
                      : (
                        <Typography sx={{
                          fontWeight: 500
                        }}
                        >
                          {statusIndex + 1}
                        </Typography>
                      )}
                  </Box>
                  <Typography
                    textAlign='center'
                    sx={{
                      fontWeight: currentStatusIndex === statusIndex ? 600 : 400,
                      fontSize: 14,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {PROPOSAL_STATUS_LABELS[status as ProposalStatus]}
                  </Typography>
                </Stack>
              </Grid>
              {statusIndex !== proposalStatuses.length - 1 && (
                <Grid item md={12 / 13}>
                  <Divider
                    sx={{
                      position: 'relative',
                      top: stepperDimension / 2
                    }}
                  />
                </Grid>
              )}
            </Fragment>
          );
        })}
        <CreateVoteModal
          isProposal={true}
          open={isModalOpen}
          onCreateVote={async () => {
            await updateProposalStatus('vote_active');
            setIsModalOpen(false);
          }}
          onClose={() => {
            setIsModalOpen(false);
          }}
        />
      </Grid>
      <Grid
        container
        mb={2}
        sx={{
          display: {
            xs: 'flex',
            md: 'none'
          }
        }}
      >
        <Box justifyContent='space-between' gap={2} alignItems='center' my='6px'>
          <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
            <div className='octo-propertyname octo-propertyname--readonly'>
              <Button>Status</Button>
            </div>
            <Box display='flex' flex={1}>
              <Select
                value={currentStatus ?? ''}
                onChange={(e) => {
                  updateProposalStatus(e.target.value as ProposalStatus);
                }}
                renderValue={(status) => {
                  return <Typography>{PROPOSAL_STATUS_LABELS[status as ProposalStatus]}</Typography>;
                }}
              >
                {
                  proposalStatuses.map((status) => {
                    const canChangeStatus = currentStatus ? (currentStatus === 'discussion' && status === 'review' ? reviewers.length !== 0 : true) && (proposalUserGroups.some(
                      proposalUserGroup => proposalStatusTransitionPermission[currentStatus]?.[proposalUserGroup]?.includes(status as ProposalStatus)
                    )) : false;

                    return (
                      <MenuItem
                        sx={{
                          p: 1
                        }}
                        value={status}
                        disabled={!canChangeStatus}
                      >
                        <Stack>
                          <Typography>{PROPOSAL_STATUS_LABELS[status as ProposalStatus]}</Typography>
                          <Typography
                            variant='subtitle2'
                            sx={{
                              whiteSpace: 'break-spaces'
                            }}
                          >
                            {proposalStatusTooltips[status]}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    );
                  })
                }
              </Select>
            </Box>
          </Box>
        </Box>
      </Grid>
    </>
  );
}
