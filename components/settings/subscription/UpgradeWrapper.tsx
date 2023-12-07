import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { TooltipProps } from '@mui/material/Tooltip';
import Tooltip from '@mui/material/Tooltip';
import type { ReactNode, SyntheticEvent } from 'react';

import { useIsAdmin } from 'hooks/useIsAdmin';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

export const upgradeMessages = {
  page_permissions: 'Upgrade to a paid plan to change page permissions',
  forum_permissions: 'Upgrade to a paid plan to change forum permissions',
  proposal_permissions: 'Upgrade to a paid plan to change proposal permissions',
  bounty_permissions: 'Upgrade to a paid plan to change reward permissions',
  custom_roles: 'Upgrade to a paid plan to use custom roles',
  invite_guests: 'Upgrade to a paid plan to invite members with guest-level access',
  customise_member_property: 'Upgrade to a paid plan to use this member property',
  api_access: 'Upgrade to a paid plan to get access to the API',
  custom_domain: 'Upgrade to a paid plan to use a custom app domain',
  upgrade: 'Upgrade your subscription'
};

export type UpgradeContext = keyof typeof upgradeMessages;

/**
 * @onClick By default, this opens the settings dialog on the billing tab. Pass a custom handler to override this and provide your own selling flow.
 * User needs to be an admin
 */
export type Props = {
  upgradeContext?: UpgradeContext;
  forceDisplay?: boolean;
  onClick?: () => void;
};

export function UpgradeWrapper({
  children,
  upgradeContext,
  onClick,
  forceDisplay,
  tooltipProps
}: Props & { children: ReactNode; tooltipProps?: TooltipProps }) {
  const { openUpgradeSubscription } = useSettingsDialog();

  const { isFreeSpace } = useIsFreeSpace();
  const isAdmin = useIsAdmin();

  function handleClick(ev: SyntheticEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    // Don't perform any actions for non-admins
    if (!isAdmin) {
      return;
    }

    if (onClick) {
      onClick();
    } else {
      openUpgradeSubscription();
    }
  }

  if (!isFreeSpace && !forceDisplay) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }

  return (
    <Tooltip {...tooltipProps} title={upgradeContext ? upgradeMessages[upgradeContext] : ''}>
      <Box onClick={handleClick} position='relative' sx={{ cursor: 'pointer' }}>
        {children}

        <Box position='absolute' top={0} right={0} bottom={0} left={0} zIndex={1}></Box>
      </Box>
    </Tooltip>
  );
}

export function UpgradeChip({ upgradeContext, forceDisplay, onClick }: Props) {
  const { isFreeSpace } = useIsFreeSpace();

  if (!isFreeSpace && !forceDisplay) {
    return null;
  }

  return (
    <UpgradeWrapper upgradeContext={upgradeContext} forceDisplay onClick={onClick}>
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
