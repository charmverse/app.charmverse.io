import { Box, Stack } from '@mui/material';

import ConnectSnapshot from 'components/proposals/ProposalPage/components/EvaluationSidebar/components/VoteEvaluation/components/PublishToSnapshot/components/ConnectSnapshot';
import Legend from 'components/settings/Legend';
import { ConnectCollabland } from 'components/settings/space/components/ConnectCollabland';

export function SpaceIntegrations() {
  return (
    <Stack>
      <Stack>
        <Legend mt={3}>Snapshot.org Integration</Legend>
        <Box display='flex' flexDirection='column' gap={1}>
          <ConnectSnapshot />
        </Box>
      </Stack>
      <Stack>
        <Legend mt={3}>Collab.land Integration</Legend>
        <Box display='flex' flexDirection='column' gap={1}>
          <ConnectCollabland />
        </Box>
      </Stack>
    </Stack>
  );
}
