import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import { Menu, MenuItem, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { Feature } from '@packages/features/constants';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import Link from 'components/common/Link';
import { SectionName } from 'components/common/PageLayout/components/Sidebar/components/SectionName';
import { SidebarLink } from 'components/common/PageLayout/components/Sidebar/components/SidebarButton';
import { useMemberProfileDialog } from 'components/members/hooks/useMemberProfileDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSettingsDialog, type SettingsPath } from 'hooks/useSettingsDialog';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { getSpaceUrl } from 'lib/utils/browser';

import { ACCOUNT_TABS, SPACE_SETTINGS_TABS } from '../config';
import { useSpaceSubscription } from '../subscription/hooks/useSpaceSubscription';
import { UpgradeChip } from '../subscription/UpgradeWrapper';

type Props = {
  activePath?: SettingsPath;
  onSelectPath: (path?: SettingsPath) => void;
};

export function SettingsMenu({ activePath, onSelectPath }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const isMobile = useSmallScreen();
  const { memberSpaces } = useSpaces();
  const isAdmin = useIsAdmin();
  const { mappedFeatures } = useSpaceFeatures();
  const { user } = useUser();
  const isSpaceSettingsVisible = !!memberSpaces.find((s) => s.name === currentSpace?.name);

  const { subscriptionEnded, hasPassedBlockQuota } = useSpaceSubscription();
  const switchSpaceMenu = usePopupState({ variant: 'popover', popupId: 'switch-space' });
  const { showUserProfile } = useMemberProfileDialog();
  const { onClose: closeSettingsDialog } = useSettingsDialog();
  return (
    <Box
      component='aside'
      width={{ xs: '100%', md: 300 }}
      minWidth={{ xs: '100%', md: 300 }}
      display={isMobile ? (!activePath && 'block') || 'none' : 'block'}
      overflow='auto'
      sx={{
        backgroundColor: (theme) => theme.palette.sidebar.background
      }}
    >
      <Box mt={2} py={0.5}>
        <SectionName>Account</SectionName>
      </Box>
      {ACCOUNT_TABS.map((tab) => (
        <SidebarLink
          key={tab.path}
          data-test={`space-settings-tab-${tab.path}`}
          label={tab.label}
          icon={tab.icon}
          onClick={() => {
            if (user && tab.path === 'profile') {
              closeSettingsDialog();
              showUserProfile(user.id);
              return null;
            } else {
              onSelectPath(tab.path);
            }
          }}
          active={activePath === tab.path}
        />
      ))}
      {currentSpace && isSpaceSettingsVisible && (
        <Box mt={2} py={0.5}>
          <SectionName>Space</SectionName>
        </Box>
      )}
      {currentSpace &&
        isSpaceSettingsVisible &&
        SPACE_SETTINGS_TABS.map((tab) =>
          !tab.adminOnly || isAdmin ? (
            <SidebarLink
              data-test={`space-settings-tab-${tab.path}`}
              key={tab.path}
              label={mappedFeatures[tab.path as Feature]?.title || tab.label}
              icon={tab.icon}
              onClick={() => onSelectPath(tab.path)}
              active={activePath === tab.path}
              section={tab.path}
            >
              {tab.path === 'subscription' && hasPassedBlockQuota && currentSpace.paidTier !== 'enterprise' ? (
                <UpgradeChip forceDisplay upgradeContext='upgrade' />
              ) : null}
            </SidebarLink>
          ) : null
        )}
      {subscriptionEnded && memberSpaces.length > 1 && (
        <Box>
          <SidebarLink
            data-test='space-settings-tab-switch-space'
            label='Switch space'
            icon={<ChangeCircleIcon fontSize='small' />}
            {...bindTrigger(switchSpaceMenu)}
            active={false}
          />
          <Menu {...bindMenu(switchSpaceMenu)} sx={{ width: '100%' }}>
            {memberSpaces.map((_space) => (
              <MenuItem
                key={_space.id}
                component={Link}
                href={getSpaceUrl({ domain: _space.domain, customDomain: _space.customDomain })}
              >
                <Typography noWrap ml={1}>
                  {_space.name}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}
    </Box>
  );
}
