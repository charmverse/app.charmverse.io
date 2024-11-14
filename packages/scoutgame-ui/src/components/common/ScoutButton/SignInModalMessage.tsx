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

  const title =
    path === 'claim'
      ? 'Please sign in to view your very own Claim page and collect your rewards!'
      : 'Please sign in to scout this builder!';
  const src = path === 'claim' ? '/images/profile/purple-unicorn.png' : '/images/profile/builder-dog.png';

  return (
    <Dialog
      title='Hi, there! Have we met?'
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 400 } }}
      fullWidth
    >
      <Stack alignItems='center' mt={2} gap={2}>
        <Typography textAlign='center' fontWeight={600}>
          {title}
        </Typography>
        <Image
          src={src}
          alt='Please login'
          width={300}
          height={300}
          sizes='100vw'
          style={{ height: 300, width: 'auto' }}
        />
        <Button data-test='modal-sign-in-button' fullWidth onClick={handleClose}>
          Continue
        </Button>
      </Stack>
    </Dialog>
  );
}
