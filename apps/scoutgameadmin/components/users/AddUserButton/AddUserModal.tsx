import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Button,
  TextField,
  CircularProgress,
  InputAdornment,
  Link,
  Typography,
  Box
} from '@mui/material';
import React, { useState } from 'react';
import { mutate } from 'swr';

import { useCreateUser, useSearchForUser } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
};

export function AddUserModal({ open, onClose, onAdd }: Props) {
  const [repoInput, setTextInput] = useState('');
  const { trigger: createUser, isMutating: isCreating } = useCreateUser();
  const debouncedFilterString = useDebouncedValue(repoInput);
  const { data: user, error, isValidating, isLoading } = useSearchForUser(debouncedFilterString);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser({ searchString: repoInput });
    onAdd();
    onClose();
    setTextInput('');
    // clear SWR cache
    mutate(
      (key) => true, // which cache keys are updated
      undefined // update cache data to `undefined`
      // { revalidate: false } // do not revalidate
    );
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 400 } }} fullWidth>
      <DialogTitle>Add scout</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            label='User identifier'
            type='text'
            placeholder='Farcaster id, username or Github username'
            fullWidth
            value={repoInput}
            onChange={(e) => setTextInput(e.target.value)}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position='end'>
                    {(isLoading || isValidating) && <CircularProgress size={20} />}
                  </InputAdornment>
                )
              }
            }}
          />
          {error && (
            <Box p={1}>
              <Typography variant='caption' color='error'>
                {error.message || error.status || error.toString()}
              </Typography>
            </Box>
          )}
          {(isValidating || isLoading) && (
            <Box p={1}>
              <Typography variant='caption'>Checking...</Typography>
            </Box>
          )}
          {!isValidating && !user && !error && (
            <Box p={1}>
              <Typography variant='caption'>No user or waitlist entry found</Typography>
            </Box>
          )}
          {!isValidating && user?.scout && (
            <>
              <Box p={1}>
                <Typography variant='h6'>Scout Game profile found</Typography>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>Profile:</span>{' '}
                  <Link href={`https://scoutgame.xyz/u/${user.scout.path}`} target='_blank'>
                    https://scoutgame.xyz/u/{user.scout.path}
                  </Link>
                </Typography>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>Points Balance:</span> {user.scout.currentBalance}
                </Typography>
                {user.scout.farcasterName && (
                  <Typography>
                    <span style={{ fontWeight: 'bold' }}>Farcaster:</span>{' '}
                    <Link href={`https://warpcast.com/${user.scout.farcasterName}`} target='_blank'>
                      {user.scout.farcasterName}
                    </Link>
                  </Typography>
                )}
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>Github:</span>{' '}
                  {user.scout.githubLogin ? (
                    <Link href={`https://github.com/${user.scout.githubLogin}`} target='_blank'>
                      {user.scout.githubLogin}
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </Typography>
                {user.scout.builderStatus && (
                  <Typography>
                    <span style={{ fontWeight: 'bold' }}>Builder status:</span> {user.scout.builderStatus}
                  </Typography>
                )}
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>Joined:</span> {new Date(user.scout.createdAt).toDateString()}
                </Typography>
              </Box>
              <Stack direction='row' spacing={2} justifyContent='flex-end'>
                <Button variant='outlined' color='secondary' onClick={onClose}>
                  Cancel
                </Button>
                {user.scout.builderStatus === 'applied' && (
                  <LoadingButton disabled loading={isCreating} type='submit' color='primary' variant='contained'>
                    Approve builder
                  </LoadingButton>
                )}
              </Stack>
            </>
          )}
          {!isValidating && user?.waitlistUser && (
            <>
              <Box p={1}>
                <Typography variant='h6'>Waitlist entry found</Typography>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>Farcaster:</span>{' '}
                  <Link href={`https://warpcast.com/${user.waitlistUser.username}`} target='_blank'>
                    {user.waitlistUser.username}
                  </Link>
                </Typography>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>Github:</span>{' '}
                  {user.waitlistUser.githubLogin ? (
                    <Link href={`https://github.com/${user.waitlistUser.githubLogin}`} target='_blank'>
                      {user.waitlistUser.githubLogin}
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </Typography>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>Percentile:</span> {user.waitlistUser.percentile}
                </Typography>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>Joined:</span>{' '}
                  {new Date(user.waitlistUser.createdAt).toDateString()}
                </Typography>
              </Box>
              <Stack direction='row' spacing={2} justifyContent='flex-end'>
                <Button variant='outlined' color='secondary' onClick={onClose}>
                  Cancel
                </Button>
                <LoadingButton loading={isCreating} type='submit' color='primary' variant='contained'>
                  Add {user.waitlistUser.githubLogin ? 'builder' : 'scout'}
                </LoadingButton>
              </Stack>
            </>
          )}
          {!isValidating && user?.farcasterUser && (
            <>
              <Box p={1}>
                <Typography variant='h6'>Farcaster profile found</Typography>
                <Typography>
                  Username:{' '}
                  <Link href={`https://warpcast.com/${user.farcasterUser.username}`} target='_blank'>
                    {user.farcasterUser.username}
                  </Link>
                </Typography>
                <Typography>FID: {user.farcasterUser.fid}</Typography>
                <Typography>Followers: {user.farcasterUser.follower_count}</Typography>
                <Typography>Following: {user.farcasterUser.following_count}</Typography>
              </Box>
              <Stack direction='row' spacing={2} justifyContent='flex-end'>
                <Button variant='outlined' color='secondary' onClick={onClose}>
                  Cancel
                </Button>
                <LoadingButton loading={isCreating} type='submit' color='primary' variant='contained'>
                  Add scout
                </LoadingButton>
              </Stack>
            </>
          )}
        </DialogContent>
      </form>
    </Dialog>
  );
}
