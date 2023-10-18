import { useTheme } from '@emotion/react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton } from '@mui/material';

import { usePageSidebar } from 'hooks/usePageSidebar';

export default function PageActionToggle() {
  const { activeView, setActiveView } = usePageSidebar();
  const theme = useTheme();
  return (
    <IconButton
      onClick={() => {
        setActiveView(activeView === null ? 'comments' : null);
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
