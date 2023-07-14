import type { Theme } from '@emotion/react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';

import Link from 'components/common/Link';
import type { SpaceSettingsSection } from 'components/settings/config';
import { premiumSettingSections } from 'components/settings/config';
import type { UpgradeContext } from 'components/settings/subscription/components/UpgradeWrapper';
import { UpgradeChip } from 'components/settings/subscription/components/UpgradeWrapper';

export const sidebarItemStyles = ({ theme }: { theme: Theme }) => css`
  padding-left: ${theme.spacing(2)};
  padding-right: ${theme.spacing(2)};
  align-items: center;
  color: ${theme.palette.secondary.main};
  display: flex;
  font-size: 14px;
  font-weight: 500;
  padding-top: 4px;
  padding-bottom: 4px;
  margin-top: 1px;
  margin-bottom: 1px;
  &:hover {
    background-color: ${theme.palette.action.hover};
    color: inherit;
  }
  svg {
    font-size: 1.2em;
    margin-right: ${theme.spacing(1)};
  }
`;

const StyledSidebarLink = styled(Link, { shouldForwardProp: (prop) => prop !== 'active' })<{ active: boolean }>`
  ${sidebarItemStyles}
  ${({ active, theme }) =>
    active
      ? `
    background-color: ${theme.palette.action.selected};
    color: ${theme.palette.text.primary};
  `
      : ''}
  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      cursor: pointer;
    }
  }
`;

const premiumSectionToUpgradeContext: Record<(typeof premiumSettingSections)[number], UpgradeContext> = {
  roles: 'custom_roles',
  api: 'api_access'
};

export function SidebarLink({
  icon,
  label,
  section,
  ...props
}: {
  active: boolean;
  href?: string;
  icon: any;
  label: string;
  target?: string;
  onClick?: () => void;
  className?: string;
  section?: SpaceSettingsSection;
}) {
  return (
    <StyledSidebarLink {...props}>
      <Box justifyContent='space-between' display='flex' width='100%'>
        <Box display='flex' alignItems='center'>
          {icon}
          {label}
        </Box>
        {section && (premiumSettingSections as SpaceSettingsSection[]).includes(section) && (
          <span style={{ paddingLeft: 10 }}>
            <UpgradeChip
              upgradeContext={(premiumSectionToUpgradeContext as Record<SpaceSettingsSection, UpgradeContext>)[section]}
            />
          </span>
        )}
      </Box>
    </StyledSidebarLink>
  );
}
