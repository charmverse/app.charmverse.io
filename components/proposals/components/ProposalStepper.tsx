import styled from '@emotion/styled';
import CheckIcon from '@mui/icons-material/Check';
import { Divider, Grid, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { ProposalStatus, ProposalReviewer } from '@prisma/client';
import { Fragment, useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import useTasks from 'components/nexus/hooks/useTasks';
import CreateVoteModal from 'components/votes/components/CreateVoteModal';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import { proposalStatusTransitionPermission, proposalStatusTransitionRecord, PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';

type StepperContainerProps = {
  refreshProposal: KeyedMutator<ProposalWithUsers>;
  proposalUserGroups: ProposalUserGroup[];
  proposal?: ProposalWithUsers;
};

const PROPOSAL_STATUSES = Object.keys(proposalStatusTransitionRecord) as ProposalStatus[];

const proposalStatusTooltips: Record<ProposalStatus, string> = {
  private_draft: 'Only authors can view and edit this proposal',
  draft: 'Authors can edit and Workspace member can view this proposal ',
  discussion: 'Workspace members can comment on this proposal',
  review: 'Reviewers can approve this proposal',
  reviewed: 'Authors can move this proposal to vote',
  vote_active: 'Workspace members are voting on this proposal',
  vote_closed: 'The vote is complete'
};

const stepperSize = 25;

const StepperIcon = styled.div<{ isCurrent: boolean, isComplete: boolean, isEnabled: boolean }>(({ theme, isComplete, isCurrent, isEnabled }) => `
  width: ${stepperSize}px;
  height: ${stepperSize}px;
  background-color: ${isComplete
    ? theme.palette.purple.main
    : (isCurrent || isEnabled)
      ? theme.palette.teal.main
      : theme.palette.gray.main};
  transition: background-color 150ms ease-in-out;
  justify-content: center;
  align-items: center;
  display: flex;
  border-radius: 100%;
  cursor: ${isEnabled ? 'pointer' : 'default'};
  position: relative;

  &::before {
    border-radius: 100%;
    content: '';
    display: block;
    position: absolute;
    height: 100%;
    width: 100%;
    box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${theme.palette.teal.main};
    opacity: 0;
    transition: opacity 150ms ease-in-out;
  }

  ${isCurrent ? `
    &::before {
      box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${theme.palette.teal.main};
      opacity: 1;
    }
  ` : ''}

  ${(!isCurrent && isEnabled) ? `
    // disable hover UX on ios which converts first click to a hover event
    @media (pointer: fine) {

      &:hover {
        background-color: ${theme.palette.teal.dark};
        &::before  {
          box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${theme.palette.teal.dark};
          opacity: 1;
        }
      }
    }
  ` : ''}
`);

export default function ProposalStepper ({ refreshProposal, proposal, proposalUserGroups }: StepperContainerProps) {

  const { mutate: mutateTasks } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function updateProposalStatus (newStatus: ProposalStatus) {
    if (proposal && newStatus !== proposal.status) {
      await charmClient.proposals.updateStatus(proposal.id, newStatus);
      await refreshProposal();
      mutateTasks();
    }
  }

  function openVoteModal () {
    setIsModalOpen(true);
  }

  return (
    <>
      <DesktopStepper
        currentStatus={proposal?.status}
        reviewers={proposal?.reviewers || []}
        openVoteModal={openVoteModal}
        proposalUserGroups={proposalUserGroups}
        updateProposalStatus={updateProposalStatus}
      />
      <MobileStepper
        currentStatus={proposal?.status}
        reviewers={proposal?.reviewers || []}
        openVoteModal={openVoteModal}
        proposalUserGroups={proposalUserGroups}
        updateProposalStatus={updateProposalStatus}
      />
      <CreateVoteModal
        proposal={proposal}
        open={isModalOpen}
        onCreateVote={() => {
          setIsModalOpen(false);
          updateProposalStatus('vote_active');
        }}
        onPublishToSnapshot={() => {
          setIsModalOpen(false);
          updateProposalStatus('vote_active');
        }}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
    </>
  );
}

type StepperProps = {
  openVoteModal: () => void;
  currentStatus?: ProposalStatus;
  reviewers: ProposalReviewer[];
  proposalUserGroups: ProposalUserGroup[];
  updateProposalStatus: (newStatus: ProposalStatus) => Promise<void>;
}

function DesktopStepper ({ openVoteModal, currentStatus, proposalUserGroups, updateProposalStatus, reviewers }: StepperProps) {

  const currentStatusIndex = currentStatus ? PROPOSAL_STATUSES.indexOf(currentStatus) : -1;

  return (

    <Grid
      container
      display={{
        xs: 'none',
        md: 'flex'
      }}
    >
      {PROPOSAL_STATUSES.map((status, statusIndex) => {
        const canChangeStatus = currentStatus ? (currentStatus === 'discussion' && status === 'review' ? reviewers.length !== 0 : true) && (
          proposalUserGroups.some(
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
                <Tooltip title={proposalStatusTooltips[status]}>
                  <StepperIcon
                    isComplete={currentStatusIndex > statusIndex}
                    isCurrent={currentStatusIndex === statusIndex}
                    isEnabled={canChangeStatus}
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
                    {currentStatusIndex > statusIndex
                      ? <CheckIcon fontSize='small' />
                      : (
                        <Typography fontWeight={500}>
                          {statusIndex + 1}
                        </Typography>
                      )}
                  </StepperIcon>
                </Tooltip>
                <Typography
                  textAlign='center'
                  fontWeight={currentStatusIndex === statusIndex ? 600 : 400}
                  fontSize={14}
                  whiteSpace='nowrap'
                >
                  {PROPOSAL_STATUS_LABELS[status as ProposalStatus]}
                </Typography>
              </Stack>
            </Grid>
            {statusIndex !== PROPOSAL_STATUSES.length - 1 && (
              <Grid item md={12 / 13}>
                <Divider
                  sx={{
                    position: 'relative',
                    top: stepperSize / 2
                  }}
                />
              </Grid>
            )}
          </Fragment>
        );
      })}

    </Grid>
  );
}

function MobileStepper ({ openVoteModal, currentStatus, proposalUserGroups, updateProposalStatus, reviewers }: StepperProps) {

  return (
    <Box
      width='100%'
      display={{
        xs: 'flex',
        md: 'none'
      }}
    >
      <Box width='100%' justifyContent='space-between' gap={2} alignItems='center' my='6px'>
        <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
          <div className='octo-propertyname octo-propertyname--readonly'>
            <Button>Status</Button>
          </div>
          <Box display='flex' flex={1}>
            <Select
              fullWidth
              value={currentStatus ?? ''}
              onChange={(e) => {
                const status = e.target.value as ProposalStatus;
                const canChangeStatus = currentStatus ? (currentStatus === 'discussion' && status === 'review' ? reviewers.length !== 0 : true) && (proposalUserGroups.some(
                  proposalUserGroup => proposalStatusTransitionPermission[currentStatus]?.[proposalUserGroup]?.includes(status as ProposalStatus)
                )) : false;

                if (canChangeStatus) {
                  if (status === 'vote_active') {
                    openVoteModal();
                  }
                  else {
                    updateProposalStatus(status);
                  }
                }
              }}
              renderValue={(status) => {
                return <Typography>{PROPOSAL_STATUS_LABELS[status as ProposalStatus]}</Typography>;
              }}
            >
              {PROPOSAL_STATUSES.map((status) => {
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
              })}
            </Select>
          </Box>
        </Box>
      </Box>

    </Box>
  );
}
