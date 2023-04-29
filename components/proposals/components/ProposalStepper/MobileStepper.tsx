import type { ProposalStatus } from '@charmverse/core/dist/prisma';
import { Box, MenuItem, Select, Stack, Typography } from '@mui/material';

import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import {
  proposalStatusDetails,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS
} from 'lib/proposal/proposalStatusTransition';

import type { StepperProps } from './interfaces';

export function MobileStepper({
  openVoteModal,
  proposal,
  updateProposalStatus,
  proposalFlowPermissions
}: StepperProps) {
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
              value={proposal?.status ?? ''}
              onChange={(e) => {
                const status = e.target.value as ProposalStatus;
                updateStatus(status);
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
                    disabled={!proposalFlowPermissions?.[status]}
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
