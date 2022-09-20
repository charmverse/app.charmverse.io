import CloseIcon from '@mui/icons-material/Close';
import { AppBar, Box, Dialog, DialogContent, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import Avatar from 'components/common/Avatar';
import PrimaryButton from 'components/common/PrimaryButton';
import NftAvatarSection from 'components/profile/components/SetAvatarPopup/NftAvatarSection';
import { useUser } from 'hooks/useUser';
import React, { useEffect, useState } from 'react';

import Slide from '@mui/material/Slide';
import type { TransitionProps } from '@mui/material/transitions';
import { useUpdateProfileAvatar } from 'components/profile/components/UserDetails/hooks/useUpdateProfileAvatar';
import { useS3UploadInput } from 'hooks/useS3UploadInput';
import type { NftData } from 'lib/blockchain/interfaces';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

const Transition = React.forwardRef((
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) => {
  return <Slide direction='up' ref={ref} {...props} />;
});

export default function SetAvatarPopup () {
  const [isVisible, setIsVisible] = useState(false);
  const { user, updateUser } = useUser();
  const { updateProfileAvatar } = useUpdateProfileAvatar();
  const [isSavingPic, setIsSavingPic] = useState(false);
  const [isSavingNft, setIsSavingNft] = useState(false);

  async function savePicAvatar (url: string) {
    setIsSavingPic(true);

    try {
      await updateProfileAvatar(url);
    }
    finally {
      setIsSavingPic(false);
    }
  }

  async function saveNftAvatar (nft: NftData) {
    setIsSavingNft(true);

    try {
      await updateProfileAvatar({
        avatar: nft.imageThumb || nft.image,
        avatarChain: nft.chainId,
        avatarContract: nft.contract,
        avatarTokenId: nft.tokenId
      });
    }
    finally {
      setIsSavingNft(false);
    }
  }

  const { inputRef, openFilePicker, onFileChange } = useS3UploadInput(savePicAvatar);

  function close () {
    setIsVisible(false);
    updateUser({ isNew: false });
  }

  useEffect(() => {
    setIsVisible(user?.isNew || false);
  }, [user?.isNew]);

  return (
    <Dialog fullScreen onClose={close} open={isVisible} scroll='paper' TransitionComponent={Transition}>
      <AppBar position='relative'>
        <Toolbar>
          <Typography flex={1} variant='h6' component='div'>Choose profile photo</Typography>

          <IconButton
            edge='end'
            color='inherit'
            onClick={close}
            aria-label='close'
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <DialogContent>
        <Stack justifyContent='center'>
          <Box flex={1} justifyContent='center' display='flex'>
            <Box>
              <Avatar
                size='2xLarge'
                avatar={user?.avatar}
                name={user?.username || ''}
                variant='circular'
                isNft={hasNftAvatar(user)}
              />
            </Box>
          </Box>

          <Box justifyContent='center' flex={1} display='flex' mt={2}>
            <input
              type='file'
              hidden
              accept='image/*'
              ref={inputRef}
              onChange={onFileChange}
            />
            <PrimaryButton sx={{ px: 4 }} onClick={openFilePicker} loading={isSavingPic}>Upload your image</PrimaryButton>
          </Box>

          <Box justifyContent='center' flex={1} display='flex' mt={2}>
            <NftAvatarSection onSelect={saveNftAvatar} isSaving={isSavingNft} />
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
