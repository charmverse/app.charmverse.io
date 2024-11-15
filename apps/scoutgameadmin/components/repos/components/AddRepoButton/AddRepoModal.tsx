import { LoadingButton } from '@mui/lab';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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

import { useSearchReposByOwnerFromGithub } from 'hooks/api/github';
import { useCreateRepos } from 'hooks/api/repos';
import { useDebouncedValue } from 'hooks/useDebouncedValue';

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
};

export function AddRepoModal({ open, onClose, onAdd }: Props) {
  const [repoInput, setRepoInput] = useState('');
  const { trigger: createRepos, isMutating: isImporting } = useCreateRepos();
  const debouncedFilterString = useDebouncedValue(repoInput);
  const {
    data: reposFromGithub,
    error,
    isValidating,
    isLoading
  } = useSearchReposByOwnerFromGithub(debouncedFilterString);

  const newRepos = reposFromGithub?.filter((g) => !g.exists) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRepos({ owner: repoInput });
    onAdd();
    onClose();
    setRepoInput('');
    // clear SWR cache
    mutate(
      (key) => true, // which cache keys are updated
      undefined // update cache data to `undefined`
      // { revalidate: false } // do not revalidate
    );
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 400 } }} fullWidth>
      <DialogTitle>Add repos by owner</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Repository Owner'
            type='text'
            fullWidth
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
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
            <Typography variant='caption' color='error'>
              {error.message || error.status || error.toString()}
            </Typography>
          )}
          {(isValidating || isLoading) && <Typography variant='caption'>Checking for repos...</Typography>}
          {!isValidating && reposFromGithub && !error && (
            <>
              <Typography variant='caption'>
                Found {newRepos.length} new repo{newRepos.length !== 1 ? 's' : ''}
                {reposFromGithub.length !== newRepos.length ? ` of ${reposFromGithub.length}` : ''}
              </Typography>
              <Box maxHeight={100} overflow='auto'>
                {newRepos.map((g) => (
                  <Typography component='p' variant='caption' key={g.fullName}>
                    &ndash;{' '}
                    <Link href={g.url} target='_blank'>
                      {g.fullName}
                    </Link>
                  </Typography>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' color='secondary' onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            loading={isImporting}
            disabled={error || newRepos.length === 0}
            type='submit'
            color='primary'
            variant='contained'
          >
            Import
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
