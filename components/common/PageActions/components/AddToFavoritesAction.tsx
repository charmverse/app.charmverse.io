import type { Page, PageType } from '@charmverse/core/prisma';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import { ListItemButton, Box, ListItemText, Tooltip } from '@mui/material';
import { useRouter } from 'next/router';

import { useToggleFavorite } from 'hooks/useToggleFavorite';

export function AddToFavoritesAction({ pageId, onComplete }: { pageId: string; onComplete?: VoidFunction }) {
  const { isFavorite, toggleFavorite } = useToggleFavorite({ pageId });

  function onClick() {
    toggleFavorite();
    onComplete?.();
  }

  return (
    <ListItemButton onClick={onClick}>
      <Box
        sx={{
          mr: 0.5,
          position: 'relative',
          left: -4,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {isFavorite ? <FavoritedIcon /> : <NotFavoritedIcon />}
      </Box>
      <ListItemText primary={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} />
    </ListItemButton>
  );
}
