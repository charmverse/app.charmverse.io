'use client';

import InfoIcon from '@mui/icons-material/Info';
import { Avatar, Box, Button, Menu, IconButton, MenuItem, Stack, Typography } from '@mui/material';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { MouseEvent } from 'react';

export function Header() {
  const { user } = useUser();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <Stack
      flexDirection='row'
      justifyContent='space-between'
      alignItems='center'
      width='100%'
      p={1}
      component='header'
      minHeight='60px'
    >
      <Link href='/scout'>
        <Image
          src='/images/scout-game-logo.png'
          width={77.77}
          height={35}
          alt='Scout Game logo'
          priority={true}
          style={{ verticalAlign: 'middle' }}
        />
      </Link>
      <Stack flexDirection='row' alignItems='center'>
        <Link href='/info'>
          <IconButton sx={{ bgcolor: 'secondary.main', width: '100%', color: 'black.main' }}>
            <InfoIcon color='secondary' />
          </IconButton>
        </Link>
        {user ? (
          <Box
            borderColor='secondary.main'
            borderRadius='30px'
            sx={{
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderColor: 'secondary.main',
                borderRadius: '28px',
                borderWidth: '2px',
                borderStyle: 'solid',
                pointerEvents: 'none'
              }
            }}
          >
            <Button
              variant='text'
              onClick={handleOpenUserMenu}
              sx={{ p: 0, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Typography fontSize='16px' sx={{ pl: 2 }} color='text.primary' data-test='user-points-balance'>
                {user.currentBalance}
              </Typography>
              <Image
                src='/images/profile/scout-game-icon.svg'
                width={20}
                height={20}
                alt='Scout Game points icon'
                priority={true}
              />
              <Avatar src={user?.avatar || undefined} />
            </Button>
            <Menu
              sx={{ mt: 5 }}
              slotProps={{
                paper: { sx: { '.MuiList-root': { pb: 0 }, maxWidth: '250px' } }
              }}
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              onClick={handleCloseUserMenu}
            >
              <MenuItem>
                <Link href='/profile'>{user.displayName}</Link>
              </MenuItem>
            </Menu>
          </Box>
        ) : null}
      </Stack>
    </Stack>
  );
}
