import type { ProposalStatus } from '@charmverse/core/prisma';
import { Box, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import {
  proposalStatusDetails,
  PROPOSAL_STATUS_LABELS,
  getProposalStatuses
} from 'lib/proposal/proposalStatusTransition';

import type { StepperProps } from './interfaces';

export function MobileStepper({
  proposalStatus,
  handleProposalStatusUpdate,
  proposalFlowPermissions,
  archived,
  evaluationType
}: StepperProps) {
  function updateStatus(newStatus: ProposalStatus) {
    if (proposalFlowPermissions?.[newStatus]) {
      handleProposalStatusUpdate(newStatus);
    }
  }
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
          <PropertyLabel readOnly>Status</PropertyLabel>
          <Tooltip title={archived ? 'Archived proposals cannot be updated' : ''}>
            <Box display='flex' flex={1}>
              <Select
                fullWidth
                value={proposalStatus ?? ''}
                onChange={(e) => {
                  const status = e.target.value as ProposalStatus;
                  updateStatus(status);
                }}
                renderValue={(status) => {
                  return <Typography>{PROPOSAL_STATUS_LABELS[status as ProposalStatus]}</Typography>;
                }}
              >
                {getProposalStatuses(evaluationType).map((status) => {
                  return (
                    <MenuItem
                      key={status}
                      sx={{
                        p: 1
                      }}
                      value={status}
                      disabled={!proposalFlowPermissions?.[status] && !archived}
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
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
