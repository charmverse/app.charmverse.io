import { useTheme } from '@emotion/react';
import CheckIcon from '@mui/icons-material/Check';
import { Divider, Grid, Stack, Typography } from '@mui/material';
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
import useIsAdmin from 'hooks/useIsAdmin';

const proposalStatuses = Object.keys(proposalStatusTransitionRecord) as ProposalStatus[];

export default function ProposalStepper (
  { refreshProposal, proposal, proposalUserGroups }:
  { refreshProposal: KeyedMutator<ProposalWithUsers>, proposalUserGroups: ProposalUserGroup[], proposal: ProposalWithUsers}
) {
  const { status: currentStatus } = proposal;
  const theme = useTheme();
  const { mutate: mutateTasks } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAdmin = useIsAdmin();

  const currentStatusIndex = proposalStatuses.indexOf(currentStatus);

  async function updateProposalStatus (newStatus: ProposalStatus) {
    if (newStatus !== currentStatus) {
      await charmClient.proposals.updateStatus(proposal.id, newStatus);
      await refreshProposal();
      mutateTasks();
    }
  }

  function openVoteModal () {
    setIsModalOpen(true);
  }

  const stepperDimension = 25;

  return (
    <Grid container>
      {proposalStatuses.map((status, statusIndex) => {
        const canChangeStatus = (currentStatus === 'discussion' && status === 'review' ? proposal.reviewers.length !== 0 : true) && (proposalUserGroups.some(
          proposalUserGroup => proposalStatusTransitionPermission[currentStatus]?.[proposalUserGroup]?.includes(status)
        ) || isAdmin);

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
  );
}
