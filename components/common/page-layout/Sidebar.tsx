
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NextLink from 'next/link';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { greyColor } from 'theme/colors';
import Header from './Header';

interface SidebarProps {
  closeSidebar: () => void;
}

export default function Sidebar ({ closeSidebar }: SidebarProps) {
  return (<>

    <Header>
      <Typography>Acme</Typography>
      <IconButton onClick={closeSidebar}>
        <ChevronLeftIcon />
      </IconButton>
    </Header>
    <Divider sx={{ mb: 3 }} />
    {/* <Box>
      <List>
        <NextLink href='/settings/account' passHref>
          <ListItem button component='a' disableRipple sx={{ py: 1, color: greyColor + ' !important' }}>
            <ListItemText disableTypography>
                <Box sx={{ fontSize: 14, fontWeight: 500 }}>Settings</Box>
            </ListItemText>
          </ListItem>
        </NextLink>
      </List>
    </Box> */}
    <Typography sx={{ color: '#999', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
      FAVORITES
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
    {/* <List>
      {['WORKSPACE', 'PRIVATE'].map((text, index) => (
        <ListItem button key={text}>
          <ListItemText disableTypography>
            <Typography variant='caption'>{text}</Typography>
          </ListItemText>
        </ListItem>
      ))}
    </List> */}
  </>);
}