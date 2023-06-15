import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type { ReactNode } from 'react';

import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

export const upgradeMessages = {
  pagePermissions: 'Upgrade to a paid plan to change page permissions'
};

type Props = {
  children: ReactNode;
  upgradeContext?: keyof typeof upgradeMessages;
};

export function UpgradeWrapper({ children, upgradeContext }: Props) {
  const { openUpgradeSubscription } = useSettingsDialog();

  const { isFreeSpace } = useIsFreeSpace();

  if (!isFreeSpace) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  return (
    <Tooltip title={upgradeContext ? upgradeMessages[upgradeContext] : ''}>
      <Box onClick={openUpgradeSubscription}>{children}</Box>
    </Tooltip>
  );
}
export function UpgradeChip({ upgradeContext }: Pick<Props, 'upgradeContext'>) {
  const { isFreeSpace } = useIsFreeSpace();

  if (!isFreeSpace) {
    return null;
  }

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
