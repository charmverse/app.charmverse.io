import { useTheme } from '@emotion/react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton } from '@mui/material';

export function TogglePageSidebarButton({ onClick, className }: { onClick: VoidFunction; className?: string }) {
  const theme = useTheme();
  return (
    <IconButton
      className={className}
      onClick={onClick}
      size='small'
      data-test='close-sidebar-button'
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
      <ChevronRightIcon />
    </IconButton>
  );
}
