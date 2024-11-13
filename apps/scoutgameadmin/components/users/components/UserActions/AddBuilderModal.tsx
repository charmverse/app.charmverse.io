import { log } from '@charmverse/core/log';
import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Button,
  TextField,
  Tooltip,
  Link,
  Typography,
  Box
} from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import React, { useState } from 'react';
import { mutate } from 'swr';

import { useGetGithubUserStats } from 'hooks/api/github';
import { useCreateBuilder } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { ScoutGameUser } from 'lib/users/getUsers';
import { setBuilderStatusAction } from 'lib/users/updateUserAction';

type Props = {
  open: boolean;
  user: Pick<ScoutGameUser, 'builderStatus' | 'id' | 'githubLogin' | 'farcasterName' | 'path'>;
  onClose: () => void;
  onSave: () => void;
};
export function AddBuilderModal({ user, open, onClose, onSave }: Props) {
  const [githubLogin, setTextInput] = useState('');
  const { trigger: createUser, error: createBuilderError, isMutating: isCreating } = useCreateBuilder();
  const githubLoginDebounced = useDebouncedValue(githubLogin);

  const { execute: setBuilderStatus, isExecuting: isExecutingUpdate } = useAction(setBuilderStatusAction, {
    onSuccess: async () => {
      onClose();
      onSave();
    },
    onError(err) {
      log.error('Error suspending user', { error: err.error.serverError });
    }
  });

  const didApply = user?.builderStatus === 'applied' || user?.builderStatus === 'rejected';
  const requireGithubLogin = !user.githubLogin;

  const githubLoginDisplayed = githubLogin || user.githubLogin;

  const { data: githubUserStats } = useGetGithubUserStats(githubLoginDisplayed);

  function rejectBuilder() {
    setBuilderStatus({ userId: user.id, status: 'rejected' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createUser({ userId: user.id, githubLogin });
    onClose();
    onSave();
    setTextInput('');
    // clear SWR cache
    mutate(
      (key) => true, // which cache keys are updated
      undefined // update cache data to `undefined`
      // { revalidate: false } // do not revalidate
    );
  }

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 400 } }} fullWidth>
      <DialogTitle>
        {didApply ? 'Review' : 'Add'} builder profile
        <br />
        <Typography variant='caption'>Register an NFT and mark the builder as approved</Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack gap={2}>
            <Stack>
              <Typography variant='caption'>Scout Game profile</Typography>
              <Link href={`https://scoutgame.xyz/u/${user.path}`} target='_blank'>
                https://scoutgame.xyz/u/{user.path}
              </Link>
            </Stack>
            <Stack>
              <Typography variant='caption'>Github profile</Typography>
              {requireGithubLogin && (
                <TextField
                  autoFocus
                  placeholder='Provide a Github login'
                  type='text'
                  fullWidth
                  value={githubLogin}
                  onChange={(e) => setTextInput(e.target.value)}
                  required
                  size='small'
                  sx={{ my: 0.5 }}
                />
              )}
              {githubLoginDisplayed ? (
                <Link href={`https://github.com/${githubLoginDisplayed}`} target='_blank'>
                  https://github.com/{githubLoginDisplayed}
                </Link>
              ) : (
                <>&nbsp;</>
              )}
              {githubLoginDisplayed && (
                <Typography variant='caption'>
                  Last commit:{' '}
                  {githubUserStats ? (
                    githubUserStats.lastCommit ? (
                      <Link href={githubUserStats.lastCommit.url} target='_blank'>
                        {new Date(githubUserStats.lastCommit.date).toLocaleDateString()}
                      </Link>
                    ) : (
                      'N/A'
                    )
                  ) : (
                    <em>Loading...</em>
                  )}
                </Typography>
              )}
            </Stack>
            {user.farcasterName && (
              <Stack>
                <Typography variant='caption'>Farcaster profile</Typography>
                <Link href={`https://warpcast.com/${user.farcasterName}`} target='_blank'>
                  https://warpcast.com/{user.farcasterName}
                </Link>
              </Stack>
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
              {user.builderStatus === 'applied' && (
                <LoadingButton
                  disabled={!githubLoginDisplayed}
                  loading={isExecutingUpdate}
                  color='error'
                  variant='outlined'
                  onClick={rejectBuilder}
                >
                  Reject
                </LoadingButton>
              )}
              <Tooltip title='Provide a Github login to set up a builder profile'>
                <span>
                  <LoadingButton
                    disabled={!githubLoginDisplayed}
                    loading={isCreating}
                    type='submit'
                    color='primary'
                    variant='contained'
                  >
                    Approve
                  </LoadingButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </DialogContent>
      </form>
    </Dialog>
  );
}
