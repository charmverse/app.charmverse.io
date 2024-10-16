'use client';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, ListItemText, ListItemButton, Paper, IconButton } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

import { List } from 'components/common/DocumentPageContainer/components/List';
import { useMdScreen } from 'hooks/useMediaScreens';

export function SidebarInfo() {
  const isBigScreen = useMdScreen();
  const [open, setOpen] = useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  if (!isBigScreen) {
    return null;
  }

  return (
    <Paper>
      <List component='nav'>
        <ListItemButton LinkComponent={Link} href='/info'>
          <ListItemText>All about Scout Game</ListItemText>
        </ListItemButton>
        <ListItemButton LinkComponent={Link} href='/info/about-scoutgame'>
          <ListItemText>What is Scout Game?</ListItemText>
        </ListItemButton>
        <ListItemButton LinkComponent={Link} href='/info/scouts'>
          <ListItemText>How it works for Scouts</ListItemText>
        </ListItemButton>
        <ListItemButton LinkComponent={Link} href='/info/builders'>
          <ListItemText>How it works for Builders </ListItemText>
        </ListItemButton>
        <ListItemButton LinkComponent={Link} href='/info/points'>
          <ListItemText>Scout Points</ListItemText>
        </ListItemButton>
        <ListItemButton LinkComponent={Link} href='/info/weekly-rewards'>
          <ListItemText>Weekly Builder Ranking & Rewards</ListItemText>
        </ListItemButton>
        <ListItemButton LinkComponent={Link} href='/info/builder-nfts'>
          <ListItemText>Builder NFTs</ListItemText>
        </ListItemButton>
        <ListItemButton LinkComponent={Link} href='/info/spam-policy'>
          <ListItemText>Spam Policy </ListItemText>
        </ListItemButton>
        <ListItemButton>
          <ListItemText>
            <Link href='/info/partner-rewards'>Partner Rewards</Link>
          </ListItemText>
          <IconButton onClick={handleClick} disableRipple sx={{ '&:hover': { background: 'transparent' } }}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </ListItemButton>
        <Collapse in={open} timeout='auto' unmountOnExit>
          <List component='div'>
            <ListItemButton LinkComponent={Link} href='/info/partner-rewards/celo'>
              <ListItemText>Celo</ListItemText>
            </ListItemButton>
            <ListItemButton LinkComponent={Link} href='/info/partner-rewards/game7'>
              <ListItemText>Game7</ListItemText>
            </ListItemButton>
            <ListItemButton LinkComponent={Link} href='/info/partner-rewards/moxie'>
              <ListItemText>Moxie</ListItemText>
            </ListItemButton>
            <ListItemButton LinkComponent={Link} href='/info/partner-rewards/bountycaster'>
              <ListItemText>BountyCaster</ListItemText>
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Paper>
  );
}
