import Box from '@mui/material/Box';
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
