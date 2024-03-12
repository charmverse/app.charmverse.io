import HomePageIcon from '@mui/icons-material/Home';
import NotHomePageIcon from '@mui/icons-material/HomeOutlined';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';

export function SetAsHomePageAction({ pageId, onComplete }: { pageId: string; onComplete: VoidFunction }) {
  const { space, refreshCurrentSpace } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const { trigger: updateSpace } = useUpdateSpace(space?.id);
  const isHomePage = space?.homePageId === pageId;
  const { showMessage, showError } = useSnackbar();

  function onClick() {
    updateSpace({ homePageId: isHomePage ? null : pageId })
      .then(() => {
        onComplete();
        refreshCurrentSpace();
        showMessage(isHomePage ? 'Home page unset' : 'Home page set');
      })
      .catch((error) => showError(error));
  }
  if (!isAdmin) {
    return null;
  }

  return (
    <MenuItem onClick={onClick}>
      <ListItemIcon>{isHomePage ? <HomePageIcon /> : <NotHomePageIcon />}</ListItemIcon>
      <ListItemText primary={isHomePage ? 'Unset as Home' : 'Set as Home'} />
    </MenuItem>
  );
}
