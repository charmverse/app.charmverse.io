import { Check as CheckIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Container,
  InputAdornment,
  Link,
  Typography,
  Paper,
  Stack,
  Box,
  IconButton,
  TableSortLabel
} from '@mui/material';
import React, { useState } from 'react';

import { useCreateRepo, useSearchReposByOwnerFromGithub } from 'hooks/api/repos';
import { useDebouncedValue } from 'hooks/useDebouncedValue';

interface AddRepoModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
}

export function AddRepoModal({ open, onClose, onAdd }: AddRepoModalProps) {
  const [repoInput, setRepoInput] = useState('');
  const { trigger: addGithubRepo } = useCreateRepo();
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
    await addGithubRepo({ owner: repoInput });
    onAdd();
    onClose();
    setRepoInput('');
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { maxWidth: 400 } }} fullWidth>
      <DialogTitle>Add new repos by owner</DialogTitle>
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
              {error.message}
            </Typography>
          )}
          {(isValidating || isLoading) && <Typography variant='caption'>Checking for repos...</Typography>}
          {!isValidating && reposFromGithub && !error && (
            <>
              <Typography variant='caption'>
                Found {newRepos.length} new repos
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
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={error || newRepos.length === 0} type='submit' color='primary' variant='contained'>
            Import
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
