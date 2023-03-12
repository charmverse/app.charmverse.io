import CheckIcon from '@mui/icons-material/Check';
import { Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import type { ProposalStatus } from '@prisma/client';
import { Fragment } from 'react';

import {
  proposalStatusDetails,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS
} from 'lib/proposal/proposalStatusTransition';

import type { StepperProps } from './interfaces';
import { stepperSize } from './interfaces';
import { StepperIcon } from './StepperIcon';

export function DesktopStepper({
  openVoteModal,
  proposal,
  updateProposalStatus,
  proposalFlowPermissions
}: StepperProps) {
  const currentStatusIndex = proposal?.status ? PROPOSAL_STATUSES.indexOf(proposal.status) : -1;

  function updateStatus(newStatus: ProposalStatus) {
    if (proposalFlowPermissions?.[newStatus]) {
      if (newStatus === 'vote_active') {
        openVoteModal();
      } else {
        updateProposalStatus(newStatus);
      }
    }
  }
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
            <Grid item xs display='flex' position='relative' alignItems='center' justifyContent='center'>
              <Stack alignItems='center' height='100%' gap={1}>
                <Tooltip title={proposalStatusDetails[status]}>
                  <StepperIcon
                    isComplete={currentStatusIndex > statusIndex}
                    isCurrent={currentStatusIndex === statusIndex}
                    isEnabled={!!proposalFlowPermissions?.[status]}
                    onClick={() => updateStatus(status)}
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
              <Grid item xs>
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
