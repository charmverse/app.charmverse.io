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

import { useCreateBuilder } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { ScoutGameUser } from 'lib/users/getUsers';

type Props = {
  open: boolean;
  user: Pick<ScoutGameUser, 'builderStatus' | 'id' | 'githubLogin'>;
  onClose: () => void;
  onAdd: () => void;
};

export function AddBuilderModal({ user, open, onClose, onAdd }: Props) {
  const [githubLogin, setTextInput] = useState('');
  const { trigger: createUser, error: createBuilderError, isMutating: isCreating } = useCreateBuilder();
  const githubLoginDebounced = useDebouncedValue(githubLogin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser({ userId: user.id, githubLogin });
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

  const didApply = user?.builderStatus === 'applied';
  const action = didApply ? 'Approve' : 'Add';
  const requireGithubLogin = !user.githubLogin;

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 400 } }} fullWidth>
      <DialogTitle>
        {action} builder profile
        <br />
        <Typography variant='caption'>Register an NFT and mark the builder as approved</Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack gap={2}>
            {requireGithubLogin && (
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
            {createBuilderError && (
              <Box p={1}>
                <Typography variant='caption' color='error'>
                  {createBuilderError.message || 'Failed to save builder'}
                </Typography>
              </Box>
            )}
            <Stack direction='row' spacing={2} justifyContent='flex-end'>
              <Button variant='outlined' color='secondary' onClick={onClose}>
                Cancel
              </Button>
              <LoadingButton loading={isCreating} type='submit' color='primary' variant='contained'>
                {action}
              </LoadingButton>
            </Stack>
          </Stack>
        </DialogContent>
      </form>
    </Dialog>
  );
}
