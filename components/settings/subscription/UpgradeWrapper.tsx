import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type { ReactNode } from 'react';

import { useSettingsDialog } from 'hooks/useSettingsDialog';

export const upgradeMessages = {
  pagePermissions: 'Upgrade to a paid plan to change page permissions'
};

type Props = {
  children: ReactNode;
  upgradeContext: keyof typeof upgradeMessages;
};

export function UpgradeWrapper({ children, upgradeContext }: Props) {
  const { openUpgradeSubscription } = useSettingsDialog();

  return (
    <Tooltip title={upgradeMessages[upgradeContext]}>
      <Box onClick={openUpgradeSubscription}>{children}</Box>
    </Tooltip>
  );
}
export function UpgradeChip({ upgradeContext }: Pick<Props, 'upgradeContext'>) {
  return (
    <UpgradeWrapper upgradeContext={upgradeContext}>
      <Chip
        color='orange'
        variant='outlined'
        label='UPGRADE'
        sx={{
          letterSpacing: '0.04em',
          fontSize: '9px',
          height: '16px',
          borderRadius: '3px',
          padding: '2px',
          fontWeight: 'bold',
          '& .MuiChip-label': {
            padding: '2px'
          }
        }}
      />
    </UpgradeWrapper>
  );
}
