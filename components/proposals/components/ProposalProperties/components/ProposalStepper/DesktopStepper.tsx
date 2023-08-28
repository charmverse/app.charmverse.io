import type { ProposalStatus } from '@charmverse/core/prisma';
import CheckIcon from '@mui/icons-material/Check';
import { Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import { Fragment } from 'react';

import {
  proposalStatusDetails,
  PROPOSAL_STATUS_LABELS,
  getProposalStatuses
} from 'lib/proposal/proposalStatusTransition';

import type { StepperProps } from './interfaces';
import { stepperSize } from './interfaces';
import { StepperIcon } from './StepperIcon';

const lastStatuses = ['vote_closed', 'evaluation_closed'];

export function DesktopStepper({
  proposalStatus,
  handleProposalStatusUpdate,
  proposalFlowPermissions,
  archived,
  evaluationType
}: StepperProps) {
  const statuses = getProposalStatuses(evaluationType);
  const currentStatusIndex = proposalStatus ? statuses.indexOf(proposalStatus) : -1;

  function updateStatus(newStatus: ProposalStatus) {
    if (proposalFlowPermissions?.[newStatus]) {
      handleProposalStatusUpdate(newStatus);
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
      {statuses.map((status, statusIndex) => {
        return (
          <Fragment key={status}>
            <Grid item xs display='flex' position='relative' alignItems='center' justifyContent='center'>
              <Stack alignItems='center' height='100%' gap={1}>
                <Tooltip title={archived ? 'Archived proposals cannot be updated' : proposalStatusDetails[status]}>
                  <StepperIcon
                    data-test={`proposal-status-stepper-${status}`}
                    isComplete={currentStatusIndex > statusIndex}
                    isCurrent={currentStatusIndex === statusIndex}
                    isEnabled={!!proposalFlowPermissions?.[status] && !archived}
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
            {!lastStatuses.includes(status) && (
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
