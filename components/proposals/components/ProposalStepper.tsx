import styled from '@emotion/styled';
import CheckIcon from '@mui/icons-material/Check';
import { Divider, Grid, MenuItem, Select, Stack, Tooltip, Typography, Box } from '@mui/material';
import type { ProposalStatus } from '@prisma/client';
import { Fragment } from 'react';

import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import type { AvailableProposalPermissionFlags } from 'lib/permissions/proposals/interfaces';
import { canChangeProposalStatus } from 'lib/proposal/canChangeProposalStatus';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import {
  proposalStatusDetails,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS
} from 'lib/proposal/proposalStatusTransition';

type StepperContainerProps = {
  proposalUserGroups: ProposalUserGroup[];
  proposal?: ProposalWithUsers;
  openVoteModal: () => void;
  updateProposalStatus: (newStatus: ProposalStatus) => Promise<void>;
  proposalPermissions: AvailableProposalPermissionFlags;
};

const stepperSize = 25;

const StepperIcon = styled.div<{ isCurrent: boolean; isComplete: boolean; isEnabled: boolean }>(
  ({ theme, isComplete, isCurrent, isEnabled }) => `
  width: ${stepperSize}px;
  height: ${stepperSize}px;
  background-color: ${
    isComplete ? theme.palette.purple.main : isCurrent || isEnabled ? theme.palette.teal.main : theme.palette.gray.main
  };
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

  ${
    isCurrent
      ? `
    &::before {
      box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${theme.palette.teal.main};
      opacity: 1;
    }
  `
      : ''
  }

  ${
    !isCurrent && isEnabled
      ? `
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
  `
      : ''
  }
`
);

export function ProposalStepper({
  proposal,
  proposalUserGroups,
  openVoteModal,
  updateProposalStatus,
  proposalPermissions
}: StepperContainerProps) {
  const canChangeStatus = (updatedStatus: ProposalStatus) => {
    return canChangeProposalStatus({ proposal, updatedStatus, proposalUserGroups });
  };

  return (
    <>
      <DesktopStepper
        currentStatus={proposal?.status}
        openVoteModal={openVoteModal}
        updateProposalStatus={updateProposalStatus}
        canChangeStatus={canChangeStatus}
        proposalPermissions={proposalPermissions}
      />
      <MobileStepper
        currentStatus={proposal?.status}
        openVoteModal={openVoteModal}
        updateProposalStatus={updateProposalStatus}
        canChangeStatus={canChangeStatus}
        proposalPermissions={proposalPermissions}
      />
    </>
  );
}

type StepperProps = {
  openVoteModal: () => void;
  currentStatus?: ProposalStatus;
  updateProposalStatus: (newStatus: ProposalStatus) => Promise<void>;
  canChangeStatus: (updatedStatus: ProposalStatus) => boolean;
  proposalPermissions: AvailableProposalPermissionFlags;
};

function DesktopStepper({
  openVoteModal,
  currentStatus,
  updateProposalStatus,
  canChangeStatus,
  proposalPermissions
}: StepperProps) {
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
        return (
          <Fragment key={status}>
            <Grid item md={12 / 13} display='flex' position='relative' alignItems='center' justifyContent='center'>
              <Stack alignItems='center' height='100%' gap={1}>
                <Tooltip title={proposalStatusDetails[status]}>
                  <StepperIcon
                    isComplete={currentStatusIndex > statusIndex}
                    isCurrent={currentStatusIndex === statusIndex}
                    isEnabled={canChangeStatus(status)}
                    onClick={() => {
                      if (canChangeStatus(status)) {
                        if (status === 'vote_active') {
                          openVoteModal();
                        } else {
                          updateProposalStatus(status);
                        }
                      }
                    }}
                  >
                    {currentStatusIndex > statusIndex ? (
                      <CheckIcon fontSize='small' />
                    ) : (
                      <Typography fontWeight={500}>{statusIndex + 1}</Typography>
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

function MobileStepper({
  openVoteModal,
  currentStatus,
  updateProposalStatus,
  canChangeStatus,
  proposalPermissions
}: StepperProps) {
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

                if (canChangeStatus(status)) {
                  if (status === 'vote_active') {
                    openVoteModal();
                  } else {
                    updateProposalStatus(status);
                  }
                }
              }}
              renderValue={(status) => {
                return <Typography>{PROPOSAL_STATUS_LABELS[status as ProposalStatus]}</Typography>;
              }}
            >
              {PROPOSAL_STATUSES.map((status) => {
                return (
                  <MenuItem
                    key={status}
                    sx={{
                      p: 1
                    }}
                    value={status}
                    disabled={!canChangeStatus(status)}
                  >
                    <Stack>
                      <Typography>{PROPOSAL_STATUS_LABELS[status as ProposalStatus]}</Typography>
                      <Typography
                        variant='subtitle2'
                        sx={{
                          whiteSpace: 'break-spaces'
                        }}
                      >
                        {proposalStatusDetails[status]}
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
