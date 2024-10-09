'use client';

import { Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Dialog } from '../Dialog';

export function SignInModalMessage({
  open,
  onClose,
  path = '/home'
}: {
  open: boolean;
  onClose: VoidFunction;
  path?: string;
}) {
  const router = useRouter();

  const handleClose = () => {
    onClose();
    router.push(`/login?redirectUrl=${encodeURIComponent(path)}`);
  };

  return (
    <Dialog
      title='Hi there! Have we met?'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 400 } }}
      fullWidth
    >
      <Stack gap={2} alignItems='center' mt={2}>
        <Image
          src='/images/profile/please-login.png'
          alt='Please login'
          width={200}
          height={200}
          sizes='100vw'
          style={{ height: 200, width: 'auto' }}
        />
        <Typography fontWeight={600}>Please sign in to continue</Typography>
        <Button data-test='modal-sign-in-button' fullWidth onClick={handleClose}>
          Continue
        </Button>
      </Stack>
    </Dialog>
  );
}
