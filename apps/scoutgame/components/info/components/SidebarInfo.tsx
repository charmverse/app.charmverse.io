'use client';

import CloseIcon from '@mui/icons-material/Close';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, List, ListItemText, ListItemButton, Paper, IconButton, ListSubheader, Stack } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [
  { href: '/info', text: 'All about Scout Game' },
  { href: '/info/about-scoutgame', text: 'What is Scout Game?' },
  { href: '/info/scouts', text: 'How it works for Scouts' },
  { href: '/info/builders', text: 'How it works for Builders' },
  { href: '/info/points', text: 'Scout Points' },
  { href: '/info/weekly-rewards', text: 'Weekly Builder Ranking & Rewards' },
  { href: '/info/builder-nfts', text: 'Builder NFTs' },
  { href: '/info/spam-policy', text: 'Spam Policy' }
];

const partners = [
  { href: '/info/partner-rewards/celo', text: 'Celo' },
  { href: '/info/partner-rewards/game7', text: 'Game7' },
  { href: '/info/partner-rewards/moxie', text: 'Moxie' },
  { href: '/info/partner-rewards/bountycaster', text: 'BountyCaster' },
  { href: '/info/partner-rewards/lit', text: 'Lit Protocol' },
  { href: '/info/partner-rewards/op-supersim', text: 'OP Supersim' }
];

export function SidebarInfo({ handleClose }: Readonly<{ handleClose?: () => void }>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(pathname.startsWith('/info/partner-rewards'));

  function handleClick() {
    setOpen((prevState) => !prevState);
  }

  return (
    <Paper>
      <List
        dense
        component='nav'
        aria-labelledby='info-page-list'
        subheader={
          <Stack flexDirection='row' justifyContent='space-between'>
            <ListSubheader component='h6' id='info-page-list'>
              Info pages
            </ListSubheader>
            {handleClose && (
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            )}
          </Stack>
        }
        sx={{ ml: 0 }}
      >
        {links.map((link) => (
          <ListItemButton key={link.href} selected={pathname === link.href} LinkComponent={Link} href={link.href}>
            <ListItemText>{link.text}</ListItemText>
          </ListItemButton>
        ))}
        <ListItemButton selected={pathname.startsWith('/info/partner-rewards')} onClick={handleClick}>
          <ListItemText>
            <Link href='/info/partner-rewards'>Partner Rewards</Link>
          </ListItemText>
          <IconButton size='small' disableRipple sx={{ '&:hover': { background: 'transparent' } }}>
            {open ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
          </IconButton>
        </ListItemButton>
        <Collapse in={open} timeout='auto' unmountOnExit>
          <List dense component='div'>
            {partners.map((link) => (
              <ListItemButton selected={pathname === link.href} key={link.href} LinkComponent={Link} href={link.href}>
                <ListItemText sx={{ pl: 2 }}>{link.text}</ListItemText>
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </List>
    </Paper>
  );
}
