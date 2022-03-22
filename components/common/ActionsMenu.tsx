import styled from '@emotion/styled';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton } from '@mui/material';
import { ReactNode } from 'react';

const StyledActionsMenu = styled(Box)`
  opacity: 0;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 5px;
  width: 26px;
  height: 26px;
  border-radius: 2px;
  &:hover {
    background: ${({ theme }) => theme.palette.action.hover};
  }
  text-align: center;
`;

interface ActionsMenuProps {
  onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void
  children?: ReactNode
}

export default function ActionsMenu ({ onClick, children }: ActionsMenuProps) {
  return (
    <StyledActionsMenu className='actions-menu' onClick={onClick}>
      <MoreHorizIcon color='secondary' fontSize='small' />
      {children}
    </StyledActionsMenu>
  );
}
