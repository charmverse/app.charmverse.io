import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';

import { useToggleFavorite } from 'hooks/useToggleFavorite';

export function AddToFavoritesAction({ pageId, onComplete }: { pageId: string; onComplete: VoidFunction }) {
  const { isFavorite, toggleFavorite } = useToggleFavorite({ pageId });

  function onClick() {
    toggleFavorite().then(() => {
      onComplete();
    });
  }

  return (
    <MenuItem onClick={onClick}>
      <ListItemIcon>{isFavorite ? <FavoritedIcon /> : <NotFavoritedIcon />}</ListItemIcon>
      <ListItemText primary={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} />
    </MenuItem>
  );
}
