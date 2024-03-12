import styled from '@emotion/styled';

import { Button } from 'components/common/Button';

export const FarcasterButton = styled(Button)(({ theme, disabled, loading }) => ({
  width: '100%',
  border:
    theme.palette.mode === 'dark'
      ? ''
      : `1px solid ${disabled || loading ? 'transparent' : theme.palette.farcaster.main}`,
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.farcaster.main : 'transparent',
  color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.farcaster.main,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.farcaster.dark : theme.palette.farcaster.light
  },
  height: '100%'
}));
