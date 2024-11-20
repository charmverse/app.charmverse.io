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
import { fancyTrimWords } from '@packages/utils/strings';
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
export function BuilderReviewModal({ user, open, onClose, onSave }: Props) {
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

  const requireGithubLogin = !user.githubLogin;

  const githubLoginDisplayed = githubLogin || user.githubLogin;

  const { data: githubUserStats } = useGetGithubUserStats(githubLoginDisplayed);

  async function rejectBuilder() {
    await setBuilderStatus({ userId: user.id, status: 'rejected' });
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
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 600 } }} fullWidth>
      <DialogTitle>{user?.builderStatus ? 'Review' : 'Add'} builder profile</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack gap={2}>
            <Stack direction='row'>
              <Typography sx={{ width: '120px' }}>Scout Game:</Typography>
              <Link href={`https://scoutgame.xyz/u/${user.path}`} target='_blank'>
                https://scoutgame.xyz/u/{user.path}
              </Link>
            </Stack>
            {user.farcasterName && (
              <Stack direction='row'>
                <Typography sx={{ width: '120px' }}>Farcaster:</Typography>
                <Link href={`https://warpcast.com/${user.farcasterName}`} target='_blank'>
                  https://warpcast.com/{user.farcasterName}
                </Link>
              </Stack>
            )}
            <Stack direction='row'>
              <Typography sx={{ width: '120px' }}>Github:</Typography>
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
              <Stack>
                {githubLoginDisplayed ? (
                  <Link href={`https://github.com/${githubLoginDisplayed}`} target='_blank'>
                    https://github.com/{githubLoginDisplayed}
                  </Link>
                ) : (
                  <>&nbsp;</>
                )}
                {githubLoginDisplayed && (
                  <Stack>
                    {githubUserStats ? (
                      <>
                        <Typography variant='caption'>
                          Last commit:{' '}
                          {githubUserStats.lastCommit ? (
                            <ul style={{ paddingLeft: 16 }}>
                              <li>
                                <Link href={githubUserStats.lastCommit.url} target='_blank'>
                                  {new Date(githubUserStats.lastCommit.date).toLocaleDateString()}:{' '}
                                  {fancyTrimWords(githubUserStats.lastCommit.title, 7)}
                                </Link>
                              </li>
                            </ul>
                          ) : (
                            <em>N/A</em>
                          )}
                        </Typography>
                        <Typography variant='caption'>
                          Closed pull requests: {githubUserStats.builderStrikes.length === 0 ? <em>N/A</em> : ''}
                        </Typography>
                        <ul style={{ paddingLeft: 16 }}>
                          {githubUserStats.builderStrikes.map((strike) => (
                            <li key={strike.githubEvent.url}>
                              <Typography
                                variant='caption'
                                sx={{
                                  textDecoration: strike.deletedAt ? 'line-through' : 'none',
                                  textDecorationColor: 'var(--mui-palette-primary-main)'
                                }}
                              >
                                <Link href={strike.githubEvent.url} target='_blank'>
                                  {new Date(strike.createdAt).toLocaleDateString()}:{' '}
                                  {fancyTrimWords(strike.githubEvent.title, 7)}
                                </Link>
                              </Typography>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <Typography variant='caption' component='em'>
                        Loading...
                      </Typography>
                    )}
                  </Stack>
                )}
              </Stack>
            </Stack>
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
