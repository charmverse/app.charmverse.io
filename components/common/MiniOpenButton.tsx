import { Typography } from '@mui/material';

import { Button } from 'components/common/Button';

export function MiniOpenButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant='text'
      color='secondary'
      sx={{ px: 0.5, py: 0, minWidth: 0, border: '1px solid var(--input-border)', borderRadius: 2 }}
    >
      <Typography variant='caption' fontWeight='bold' textTransform='uppercase'>
        Open
      </Typography>
    </Button>
  );
}
