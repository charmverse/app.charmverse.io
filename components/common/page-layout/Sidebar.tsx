
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import styled from '@emotion/styled';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Link from '../Link';
import MuiLink from '@mui/material/Link';
import Header from './Header';
import Avatar from '../Avatar';
import WorkspaceAvatar from '../WorkspaceAvatar';

const workspaces = [
  { name: 'CharmVerse', domain: 'charmverse' },
  { name: 'MattVerse', domain: 'mattverse' },
];

const AvatarLink = styled(NextLink)`
  cursor: pointer;
`;

const WorkspaceContainer = styled.div`
  float: left;
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(1)};
`;

interface SidebarProps {
  closeSidebar: () => void;
}

export default function Sidebar ({ closeSidebar }: SidebarProps) {

  const router = useRouter();
  const { domain } = router.query;

  return (<Box display='flex' sx={{ bgcolor: 'sidebar.background', height: '100%' }}>
    <WorkspaceContainer>
      <Grid container spacing={2} flexDirection='column'>
        {workspaces.map(workspace => (
          <Grid item key={workspace.domain}>
            <AvatarLink href={`/${workspace.domain}`} passHref>
              <MuiLink>
                <WorkspaceAvatar active={domain === workspace.domain} name={workspace.name} />
              </MuiLink>
            </AvatarLink>
          </Grid>
        ))}
        <Grid item>
          <IconButton sx={{ borderRadius: '8px' }}><AddIcon /></IconButton>
        </Grid>
      </Grid>
    </WorkspaceContainer>
    <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Header>
          <Typography>Acme</Typography>
          <IconButton onClick={closeSidebar}>
            <ChevronLeftIcon />
          </IconButton>
        </Header>
        <Divider sx={{ mb: 3 }} />
        {/* <Box>
          <List>
            <NextLink href='' passHref>
              <ListItem button component='a' disableRipple sx={{ py: 1, color: greyColor + ' !important' }}>
                <ListItemText disableTypography>
                    <Box sx={{ fontSize: 14, fontWeight: 500 }}>Settings</Box>
                </ListItemText>
              </ListItem>
            </NextLink>
          </List>
        </Box> */}
        <Typography sx={{ color: '#777', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
          FAVORITES
        </Typography>
        <List>
          <NextLink href={`/${domain}/`} passHref>
            <ListItem button component='a' sx={{ py: 0 }}>
              <ListItemText disableTypography>
                  <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>First Page</Box>
              </ListItemText>
            </ListItem>
          </NextLink>
        </List>
        <Typography sx={{ color: '#777', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
          WORKSPACE
        </Typography>
        <List>
          <NextLink href={`/${domain}/`} passHref>
            <ListItem button component='a' sx={{ py: 0 }}>
              <ListItemText disableTypography>
                  <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>First Page</Box>
              </ListItemText>
            </ListItem>
          </NextLink>
        </List>
        {/* <List>
          {['WORKSPACE', 'PRIVATE'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemText disableTypography>
                <Typography variant='caption'>{text}</Typography>
              </ListItemText>
            </ListItem>
          ))}
        </List> */}
      </Box>
      <Box>
        <Divider />
        <Box p={1} display='flex' alignItems='center' justifyContent='space-between'>
          <Box display='flex' alignItems='center'>
            <Avatar name='Dolemite' />
            <Box pl={1}>
              <Typography variant='caption' sx={{ display: 'block' }}>
                <strong>Dolemite</strong><br />
                0x141...fBf4
              </Typography>
            </Box>
          </Box>
          <Link href={`/${domain}/settings/account`}>
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Link>
        </Box>
      </Box>
    </Box>
  </Box>);
}