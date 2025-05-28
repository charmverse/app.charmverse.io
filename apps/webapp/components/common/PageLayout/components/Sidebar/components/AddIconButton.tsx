import { styled } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Tooltip } from '@mui/material';
import type { IconButtonProps } from '@mui/material/IconButton';
import MuiIconButton from '@mui/material/IconButton';

export const StyledIconButton = styled(MuiIconButton)`
  border-radius: 3px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  width: 20px;
  height: 20px;
  cursor: pointer;

  svg {
    font-size: 16px !important;
    margin: 0 !important; // override styles from SidebarLink
  }
  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      background-color: ${({ theme }) => theme.palette.action.hover};
    }
  }
  ${({ theme }) => `
    ${theme.breakpoints.down('md')} {
      height: 26px;
      width: 26px;
  `}
`;

export function AddIconButton({ tooltip, ...props }: IconButtonProps & { tooltip: string }) {
  return (
    <Tooltip disableInteractive title={tooltip} leaveDelay={0} placement='top' arrow>
      <StyledIconButton {...props}>
        <AddIcon color='secondary' />
      </StyledIconButton>
    </Tooltip>
  );
}
