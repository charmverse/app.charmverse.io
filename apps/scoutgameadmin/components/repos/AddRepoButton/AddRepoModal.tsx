import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import React, { useState } from 'react';

import { useCreateRepo } from 'hooks/api/repos';

interface AddRepoModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
}

export function AddRepoModal({ open, onClose, onAdd }: AddRepoModalProps) {
  const [repoInput, setRepoInput] = useState('');
  const { trigger: addGithubRepo } = useCreateRepo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGithubRepo({ owner: repoInput });
    onAdd();
    onClose();
    setRepoInput('');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New GitHub Repository</DialogTitle>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type='submit' color='primary'>
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
