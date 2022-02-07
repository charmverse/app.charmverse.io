import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import Toolbar from '@mui/material/Toolbar';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import FavoritedIcon from '@mui/icons-material/Star';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useColorMode } from 'context/color-mode';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';

export const headerHeight = 56;

const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${headerHeight}px;
  min-height: ${headerHeight}px;
`;

export default function Header ({ open, openSidebar }: { open: boolean, openSidebar: () => void }) {

  const router = useRouter();
  const colorMode = useColorMode();
  const [pageTitle] = usePageTitle();
  const { currentPage } = usePages();
  const [user, setUser] = useUser();
  const theme = useTheme();

  const isFavorite = currentPage && user?.favorites.some(({ pageId }) => pageId === currentPage.id);
  const isPage = router.route.includes('pagePath');

  function toggleFavorite () {
    if (!currentPage || !user) return;
    const pageId = currentPage.id;
    setUser({
      ...user,
      favorites: isFavorite
        ? user.favorites.filter(page => page.pageId !== pageId)
        : [...user.favorites, { pageId: currentPage.id, userId: '' }]
    });
  }

  return (
    <StyledToolbar variant='dense'>
      <IconButton
        color='inherit'
        aria-label='open drawer'
        onClick={openSidebar}
        edge='start'
        sx={{
          marginRight: '36px',
          ...(open && { display: 'none' })
        }}
      >
        <MenuIcon />
      </IconButton>
      <Typography noWrap component='div' sx={{ flexGrow: 1, fontWeight: 500 }}>
        {pageTitle}
      </Typography>
      {/** favorite toggle */}
      {isPage && (
      <Tooltip title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} arrow placement='bottom'>
        <IconButton sx={{ ml: 1 }} onClick={toggleFavorite} color='inherit'>
          {isFavorite ? <FavoritedIcon color='secondary' /> : <NotFavoritedIcon color='secondary' />}
        </IconButton>
      </Tooltip>
      )}
      {/** dark mode toggle */}
      <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='bottom'>
        <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
          {theme.palette.mode === 'dark' ? <Brightness7Icon color='secondary' /> : <Brightness4Icon color='secondary' />}
        </IconButton>
      </Tooltip>
    </StyledToolbar>
  );
}
