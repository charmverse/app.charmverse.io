import React, { useEffect, useState } from 'react';
import { useUser } from 'hooks/useUser';
import { AppBar, Box, Dialog, DialogContent, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import Avatar from 'components/common/Avatar';
import CloseIcon from '@mui/icons-material/Close';
import PrimaryButton from 'components/common/PrimaryButton';
import NftAvatarSection from 'components/profile/components/SetAvatarPopup/NftAvatarSection';

import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';

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
  const { user } = useUser();

  function close () {
    setIsVisible(false);
  }

  useEffect(() => {
    setIsVisible(!user?.isNew || false);
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
              <Avatar size='2xl' avatar={user?.avatar} name={user?.username || ''} variant='circular' />
            </Box>
          </Box>

          <Box justifyContent='center' flex={1} display='flex' mt={2}>
            <PrimaryButton sx={{ px: 4 }}>Upload your image</PrimaryButton>
          </Box>

          <Box justifyContent='center' flex={1} display='flex' mt={2}>
            <NftAvatarSection />
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
