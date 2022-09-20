import CheckIcon from '@mui/icons-material/Check';
import { Divider, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { ProposalStatus } from '@prisma/client';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { proposalStatusTransitionRecord, PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';

export default function ProposalStepper ({ proposal }: {proposal: ProposalWithUsers}) {
  const { status: currentStatus } = proposal;

  const currentStatusIndex = Object.keys(proposalStatusTransitionRecord).findIndex(status => status === currentStatus);

  return (
    <Box display='flex' gap={1}>
      {Object.entries(proposalStatusTransitionRecord).map(([status, availableStatuses], statusIndex) => {
        return (
          <Box display='flex' position='relative' gap={1} alignItems='center'>
            <Stack
              alignItems='center'
              gap={1}
              sx={{
                flexGrow: 1
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'blue'
                }}
              >
                {currentStatusIndex >= statusIndex ? <CheckIcon />
                  : (
                    <Typography sx={{
                      fontWeight: 500
                    }}
                    >
                      {statusIndex}
                    </Typography>
                  )}
              </Box>
              <Typography sx={{
                fontWeight: currentStatusIndex === statusIndex ? 'bold' : 'initial'
              }}
              >
                {PROPOSAL_STATUS_LABELS[status as ProposalStatus]}
              </Typography>
            </Stack>
            <Divider sx={{
              position: 'absolute'
            }}
            />
          </Box>
        );
      })}
    </Box>
  );
}
