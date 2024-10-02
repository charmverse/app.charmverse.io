import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { Button, IconButton, Stack, Typography, Dialog, DialogTitle, DialogContent } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 400 } }} fullWidth>
      <DialogTitle color='secondary'>Hi there! Have we met?</DialogTitle>
      <IconButton
        data-test='close-modal'
        aria-label='close'
        onClick={handleClose}
        sx={(theme) => ({
          position: 'absolute',
          right: 8,
          top: 8
        })}
      >
        <HighlightOffIcon color='primary' />
      </IconButton>
      <DialogContent>
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
      </DialogContent>
    </Dialog>
  );
}
