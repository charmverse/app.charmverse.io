import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { TooltipProps } from '@mui/material/Tooltip';
import Tooltip from '@mui/material/Tooltip';
import type { ReactNode, SyntheticEvent } from 'react';

import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

export const upgradeMessages = {
  page_permissions: 'Upgrade to a paid plan to change page permissions',
  forum_permissions: 'Upgrade to a paid plan to change forum permissions',
  proposal_permissions: 'Upgrade to a paid plan to change proposal permissions',
  bounty_permissions: 'Upgrade to a paid plan to change bounty permissions',
  custom_roles: 'Upgrade to a paid plan to use custom roles',
  invite_guests: 'Upgrade to a paid plan to invite members with guest-level access',
  customise_member_property: 'Upgrade to a paid plan to use this member property',
  api_access: 'Upgrade to a paid plan to get access to the API'
};

export type UpgradeContext = keyof typeof upgradeMessages;

type Props = {
  upgradeContext?: UpgradeContext;
  forceDisplay?: boolean;
};

export function UpgradeWrapper({
  children,
  upgradeContext,
  forceDisplay,
  tooltipProps
}: Props & { children: ReactNode; tooltipProps?: TooltipProps }) {
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
    <Tooltip {...tooltipProps} title={upgradeContext ? upgradeMessages[upgradeContext] : ''}>
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
