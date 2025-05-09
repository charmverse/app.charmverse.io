import { Box, Paper } from '@mui/material';

import { UpgradeChip } from 'components/settings/subscription/UpgradeWrapper';

export default {
  title: 'common/Upgrade',
  component: UpgradeChip
};

export function Upgrade() {
  return (
    <Paper sx={{ p: 4 }}>
      <Box display='flex' width='100px' flexDirection='column' gap={4}>
        <UpgradeChip forceDisplay />
      </Box>
    </Paper>
  );
}
