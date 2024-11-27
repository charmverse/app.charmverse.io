'use client';

import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import ShareIcon from '@mui/icons-material/Share';
import { IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { baseUrl } from '@packages/utils/constants';
import Image from 'next/image';
import { useState } from 'react';

export function ShareProfile({ userPath }: { userPath: string }) {
  const profileUrl = `${baseUrl}/u/${userPath}`;
  const shareMessage = `Discover my profile on Scout Game: ${profileUrl}`;
  const [isCopied, setIsCopied] = useState(false);
  const [anchorElShare, setAnchorElShare] = useState<HTMLElement | null>(null);

  const handleOpenShareMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElShare(event.currentTarget);
  };

  const handleCloseShareMenu = () => {
    setAnchorElShare(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setIsCopied(true);
    handleCloseShareMenu();
    setTimeout(() => {
      setIsCopied(false);
    }, 500);
  };

  const handleShareToWarpcast = () => {
    handleCloseShareMenu();
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleShareToX = () => {
    handleCloseShareMenu();
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleShareToTelegram = () => {
    handleCloseShareMenu();
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Tooltip title='Share profile'>
        <IconButton size='small' onClick={handleOpenShareMenu}>
          <ShareIcon fontSize='small' color='primary' />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorElShare}
        open={Boolean(anchorElShare)}
        onClose={handleCloseShareMenu}
        onClick={handleCloseShareMenu}
      >
        <MenuItem onClick={handleShareToWarpcast}>
          <Image
            src='/images/profile/icons/warpcast-circle-icon.svg'
            width={20}
            height={20}
            alt='warpcast icon'
            style={{ marginRight: 8 }}
          />
          <Typography variant='body2'>Warpcast</Typography>
        </MenuItem>
        <MenuItem onClick={handleShareToX}>
          <Image src='/images/logos/x.png' width={20} height={20} alt='x logo' style={{ marginRight: 8 }} />
          <Typography variant='body2'>X</Typography>
        </MenuItem>
        <MenuItem onClick={handleShareToTelegram}>
          <Image
            src='/images/logos/telegram.png'
            width={20}
            height={20}
            alt='telegram logo'
            style={{ marginRight: 8 }}
          />
          <Typography variant='body2'>Telegram</Typography>
        </MenuItem>
        <MenuItem onClick={handleCopyLink} disabled={isCopied}>
          <FileCopyOutlinedIcon color='primary' fontSize='small' sx={{ mr: 1 }} />
          <Typography variant='body2'>{isCopied ? 'Copied!' : 'Copy link'}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
