import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import FavoritedIcon from '@mui/icons-material/Star';
import MenuIcon from '@mui/icons-material/Menu';
import { Theme } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useColorMode } from 'context/color-mode';
import { useScrollbarStyling } from 'hooks/useScrollbarStyling';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import * as React from 'react';
import Header, { toolbarHeight } from './Header';
import { useTitleState } from './PageTitle';
import Sidebar from './Sidebar';

const drawerWidth = 300;

const openedMixin = (theme: Theme) => ({
  marginRight: 0,
  width: drawerWidth,
  transition: theme.transitions.create(['marginRight', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme) => ({
  transition: theme.transitions.create(['marginRight', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  marginRight: 60,
  width: 0,//`calc(${theme.spacing(7)} + 1px)`,
  // [theme.breakpoints.up('sm')]: {
  //   width: `calc(${theme.spacing(9)} + 1px)`,
  // },
});

const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop: string) => prop !== 'open' })
  <{ open: boolean }>(({ theme, open }) => ({
    background: 'transparent',
    boxShadow: 'none',
    color: 'inherit',
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    })
  })
  );

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })
  // @ts-ignore mixins dont work with Typescript
  <{ open: boolean }>(({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
  );

const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${toolbarHeight}px;
  min-height: ${toolbarHeight}px;
`;

export function PageLayout ({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  const [pageTitle] = useTitleState();
  const theme = useTheme();
  const colorMode = useColorMode();
  const scrollbarStyling = useScrollbarStyling();
  const [pages] = usePages();
  const [user, setUser] = useUser();
  const thisPage = pages.find(page => page.title === pageTitle);
  const isFavorite = thisPage && user.favorites.some(({ pageId }) => pageId === thisPage.id);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  function toggleFavorite () {
    if (!thisPage) return;
    const pageId = thisPage.id;
    setUser({
      ...user,
      favorites: isFavorite
        ? user.favorites.filter(page => page.pageId !== pageId)
        : [...user.favorites, { pageId: thisPage.id, userId: '' }],
    });
  }

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <AppBar position='fixed' open={open}>
          <StyledToolbar variant='dense'>
            <IconButton
              color='inherit'
              aria-label='open drawer'
              onClick={handleDrawerOpen}
              edge="start"
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography noWrap component='div' sx={{ flexGrow: 1, fontWeight: 500 }}>
              {pageTitle}
            </Typography>
            {/** favorite toggle */}
            <Tooltip title={isFavorite ? 'Remove favorite' : 'Add to favorites'} arrow placement='bottom'>
              <IconButton sx={{ ml: 1 }} onClick={toggleFavorite} color="inherit">
                {isFavorite ? <FavoritedIcon color='secondary' /> : <NotFavoritedIcon color='secondary' />}
              </IconButton>
            </Tooltip>
            {/** dark mode toggle */}
            <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='bottom'>
              <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
                {theme.palette.mode === 'dark' ? <Brightness7Icon color='secondary' /> : <Brightness4Icon color='secondary' />}
              </IconButton>
            </Tooltip>
          </StyledToolbar>
        </AppBar>
        <Drawer variant='permanent' open={open}>
          <Sidebar closeSidebar={handleDrawerClose} favorites={user.favorites} />
        </Drawer>
        <Box sx={{
          flexGrow: 1, overflow: 'auto',
          ...scrollbarStyling,
        }}>
          <Box component='main' sx={{ flexGrow: 1 }}>
            <Header />
            {children}
          </Box>
        </Box>
      </Box>
    </>
  );
}
