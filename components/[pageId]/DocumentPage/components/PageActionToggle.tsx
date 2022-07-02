import { IconButton } from '@mui/material';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@emotion/react';

export default function PageActionToggle () {
  const { currentPageActionDisplay, setCurrentPageActionDisplay } = usePageActionDisplay();
  const theme = useTheme();
  return (
    <IconButton
      onClick={() => {
        setCurrentPageActionDisplay(currentPageActionDisplay === null ? 'votes' : null);
      }}
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
