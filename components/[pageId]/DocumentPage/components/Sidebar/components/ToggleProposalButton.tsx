import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ChevronRight } from '@mui/icons-material';
import { Box, Collapse, SvgIcon, IconButton } from '@mui/material';
import { RiChatCheckLine } from 'react-icons/ri';

const StyledToggleButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'open'
})<{ open: boolean }>(
  ({ open }) => `
  // .MuiSvgIcon-root {
  //   transform: ${open ? 'rotate(0deg)' : 'rotate(180deg)'};
  //   transition: transform 150ms ease-in-out;
  // }
`
);

export function ToggleProposalSidebarButton({ onClick, isOpen }: { onClick: VoidFunction; isOpen: boolean }) {
  const theme = useTheme();
  return (
    <IconButton
      onClick={onClick}
      size='small'
      sx={{
        '&.MuiIconButton-root': {
          borderRadius: '4px',
          transition: theme.transitions.create('opacity', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
          })
        }
      }}
    >
      {isOpen ? <ChevronRight /> : <SvgIcon component={RiChatCheckLine} />}
    </IconButton>
  );
}
