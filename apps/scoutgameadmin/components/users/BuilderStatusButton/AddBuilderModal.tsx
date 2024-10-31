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

import { useCreateBuilder, useGetUser } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';

type Props = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onAdd: () => void;
};

export function AddBuilderModal({ open, onClose, onAdd, userId }: Props) {
  const [githubLogin, setTextInput] = useState('');
  const { trigger: createUser, isMutating: isCreating } = useCreateBuilder();
  const { data: user, error, isValidating, isLoading } = useGetUser(open ? userId : undefined);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser({ userId, githubLogin });
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

  const action = user?.builderStatus === 'applied' ? 'Approve' : 'Add';

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 400 } }} fullWidth>
      <DialogTitle>
        Add or approve builder
        <br />
        <Typography variant='caption'>Register an NFT and mark the builder as approved</Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              <span style={{ fontWeight: 'bold' }}>Scout Profile:</span>{' '}
              <Link href={`https://scoutgame.xyz/u/${user?.path}`} target='_blank'>
                {user?.displayName}
              </Link>
            </Typography>
            <Typography>
              <span style={{ fontWeight: 'bold' }}>Current Builder Status:</span> {user?.builderStatus || 'N/A'}
            </Typography>
            {user && user.githubLogin && (
              <Typography>
                <span style={{ fontWeight: 'bold' }}>Github:</span>{' '}
                <Link href={`https://github.com/${user.githubLogin}`} target='_blank'>
                  {user.githubLogin}
                </Link>
              </Typography>
            )}
            {user && !user.githubLogin && (
              <TextField
                autoFocus
                label='Provide a Github login'
                type='text'
                fullWidth
                value={githubLogin}
                onChange={(e) => setTextInput(e.target.value)}
                required
              />
            )}
            {error && (
              <Box p={1}>
                <Typography variant='caption' color='error'>
                  {error.message || error.status || error.toString()}
                </Typography>
              </Box>
            )}
            <Stack direction='row' spacing={2} justifyContent='flex-end'>
              <Button variant='outlined' color='secondary' onClick={onClose}>
                Cancel
              </Button>
              <LoadingButton
                disabled={user?.builderStatus === 'approved'}
                loading={isCreating}
                type='submit'
                color='primary'
                variant='contained'
              >
                {action} builder
              </LoadingButton>
            </Stack>
          </Stack>
        </DialogContent>
      </form>
    </Dialog>
  );
}
