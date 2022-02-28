import styled from '@emotion/styled';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, IconButton } from '@mui/material';
import { ReactNode } from 'react';

const StyledActionsMenu = styled(Box)`
  background: ${({ theme }) => theme.palette.action.hover};
  opacity: 0;
  position: absolute;
  top: 0px;
  right: 0px;
`;

interface ActionsMenuProps {
  onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void
  children?: ReactNode
}

export default function ActionsMenu ({ onClick, children }: ActionsMenuProps) {
  return (
    <StyledActionsMenu className='actions-menu'>
      <IconButton size='small' onClick={onClick}>
        <MoreHorizIcon color='secondary' fontSize='small' />
      </IconButton>
      {children}
    </StyledActionsMenu>
  );
}
