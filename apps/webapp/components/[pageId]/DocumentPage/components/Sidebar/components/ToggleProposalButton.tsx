import { useTheme } from '@emotion/react';
import { ChevronRight } from '@mui/icons-material';
import { SvgIcon, IconButton } from '@mui/material';
import { RiChatCheckLine } from 'react-icons/ri';

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
