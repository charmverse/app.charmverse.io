import { Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { BasicModal } from 'components/common/Modal';

export function SignInModalMessage({ open, onClose }: { open: boolean; onClose: VoidFunction }) {
  const router = useRouter();

  const handleClose = () => {
    onClose();
    router.push(`/login?redirectUrl=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <BasicModal open={open} onClose={onClose} title='Hi there! Have we met?' sx={{ maxWidth: 400 }}>
      <Stack gap={2} alignItems='center'>
        <Image
          src='/images/profile/please-login.png'
          alt='Please login'
          width={200}
          height={200}
          sizes='100vw'
          style={{ maxHeight: 200 }}
        />
        <Typography fontWeight={600}>Please sign in to continue</Typography>
        <Button fullWidth onClick={handleClose}>
          Continue
        </Button>
      </Stack>
    </BasicModal>
  );
}
