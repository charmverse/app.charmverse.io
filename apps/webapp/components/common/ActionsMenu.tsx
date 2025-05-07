import styled from '@emotion/styled';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

const StyledActionsMenu = styled(Box)`
  opacity: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 2.5px;
  width: 26px;
  height: 26px;
  border-radius: 2px;
  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      background: ${({ theme }) => theme.palette.action.hover};
    }
  }
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface ActionsMenuProps {
  onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  children?: ReactNode;
}

export default function ActionsMenu({ onClick, children }: ActionsMenuProps) {
  return (
    <StyledActionsMenu className='actions-menu' onClick={onClick}>
      <MoreHorizIcon color='secondary' fontSize='small' />
      {children}
    </StyledActionsMenu>
  );
}
