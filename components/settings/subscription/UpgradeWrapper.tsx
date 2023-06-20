import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type { ReactNode, SyntheticEvent } from 'react';

import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

export const upgradeMessages = {
  pagePermissions: 'Upgrade to a paid plan to change page permissions',
  forumPermissions: 'Upgrade to a paid plan to change forum permissions',
  proposalPermissions: 'Upgrade to a paid plan to change proposal permissions',
  customRoles: 'Upgrade to a paid plan to use custom roles',
  inviteGuests: 'Upgrade to a paid plan to invite members with guest-level access',
  customiseMemberProperty: 'Upgrade to a paid plan to use this member property'
};

export type UpgradeContext = keyof typeof upgradeMessages;

type Props = {
  upgradeContext?: UpgradeContext;
  forceDisplay?: boolean;
};

export function UpgradeWrapper({ children, upgradeContext, forceDisplay }: Props & { children: ReactNode }) {
  const { openUpgradeSubscription } = useSettingsDialog();

  const { isFreeSpace } = useIsFreeSpace();

  function handleClick(ev: SyntheticEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    openUpgradeSubscription();
  }

  if (!isFreeSpace && !forceDisplay) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  return (
    <Tooltip title={upgradeContext ? upgradeMessages[upgradeContext] : ''}>
      <Box onClick={handleClick}>{children}</Box>
    </Tooltip>
  );
}

export function UpgradeChip({ upgradeContext, forceDisplay }: Props) {
  const { isFreeSpace } = useIsFreeSpace();

  if (!isFreeSpace && !forceDisplay) {
    return null;
  }

  return (
    <UpgradeWrapper upgradeContext={upgradeContext} forceDisplay>
      <Chip
        color='warning'
        variant='outlined'
        label='UPGRADE'
        sx={{
          letterSpacing: '0.04em',
          fontSize: '9px',
          width: 'fit-content',
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
