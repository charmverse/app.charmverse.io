import * as React from 'react';
import { Theme } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import styled from '@emotion/styled';
import { css } from '@emotion/react'
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'components/common/Link';
import NextLink from 'next/link';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { darkGreyColor, greyColor } from 'theme/colors';

const drawerWidth = 240;

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

// @ts-ignore necessary for content to be below app bar
const DrawerHeader = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  '& .MuiIconButton-root': {
    opacity: 0,
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  '&:hover .MuiIconButton-root': {
    opacity: 1
  },
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

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

export function PageLayout ({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography noWrap component="div">
            Welcome!
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <Typography>Acme</Typography>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <Box>
          <List>
            <NextLink href='/settings/account' passHref>
              <ListItem button component='a' disableRipple sx={{ py: 1, color: greyColor + ' !important' }}>
                <ListItemText disableTypography>
                    <Box sx={{ fontSize: 14, fontWeight: 500 }}>Settings</Box>
                </ListItemText>
              </ListItem>
            </NextLink>
          </List>
        </Box>
        <Box mb={3}>
          <Typography sx={{ color: '#999', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
            FAVORITES
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ color: '#999', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
            WORKSPACE
          </Typography>
          <List>
            <NextLink href='/blocks' passHref>
              <ListItem button component='a' sx={{ py: 0 }}>
                <ListItemText disableTypography>
                    <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>First Page</Box>
                </ListItemText>
              </ListItem>
            </NextLink>
          </List>
        </Box>
        {/* <List>
          {['WORKSPACE', 'PRIVATE'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemText disableTypography>
                <Typography variant='caption'>{text}</Typography>
              </ListItemText>
            </ListItem>
          ))}
        </List> */}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
