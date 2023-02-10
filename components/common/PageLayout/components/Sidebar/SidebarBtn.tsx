import type { Theme } from '@emotion/react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

import Link from 'components/common/Link';

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
  &:hover {
    background-color: ${theme.palette.action.hover};
    color: inherit;
  }
  svg {
    font-size: 1.2em;
    margin-right: ${theme.spacing(1)};
  }
`;

const StyledSidebarBox = styled(Box)`
  cursor: pointer;
  ${sidebarItemStyles}
`;

export function SidebarBtn({ icon, label, ...props }: { icon: any; label: string } & BoxProps) {
  return (
    <StyledSidebarBox {...props}>
      {icon}
      {label}
    </StyledSidebarBox>
  );
}

const StyledSidebarLink = styled(Link, { shouldForwardProp: (prop) => prop !== 'active' })<{ active: boolean }>`
  ${sidebarItemStyles}
  ${({ active, theme }) =>
    active
      ? `
    background-color: ${theme.palette.action.selected};
    color: ${theme.palette.text.primary};
  `
      : ''}
`;

export function SidebarLink({
  active,
  href,
  icon,
  label,
  target,
  onClick
}: {
  active: boolean;
  href: string;
  icon: any;
  label: string;
  target?: string;
  onClick?: () => void;
}) {
  return (
    <StyledSidebarLink href={href} active={active} target={target} onClick={onClick}>
      {icon}
      {label}
    </StyledSidebarLink>
  );
}
