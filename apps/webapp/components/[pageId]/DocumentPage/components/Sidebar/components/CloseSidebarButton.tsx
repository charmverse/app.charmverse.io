import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme, IconButton } from '@mui/material';

export function CloseSidebarButton({ onClick }: { onClick: VoidFunction }) {
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
      <ChevronRightIcon />
    </IconButton>
  );
}
