import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useUser } from 'hooks/useUser';

import { Button, TextField } from '@mui/material';

import { useEditorState, BangleEditor } from '@bangle.dev/react';
import { Plugin } from '@bangle.dev/core';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ISuggestingBounty } from 'types/bounty';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: ISuggestingBounty) => void;
}

export default function BountyEditorModal (props: Props) {
  const { open, onClose, onSubmit } = props;
  const [updatingContent, setUpdatingContent] = useState({});
  const [updatingPreview, setUpdatingPreview] = useState('');
  const [title, setTitle] = useState('New Bounty');
  const [user] = useUser();
  const editorState = useEditorState({
    initialValue: 'Hello world!',
    plugins: () => [
      new Plugin({
        view: () => ({
          update: (view, prevState) => {
            if (!view.state.doc.eq(prevState.doc)) {
              setUpdatingContent(view.state.doc.toJSON());
              setUpdatingPreview(view.state.doc.textContent);
            }
          }
        })
      })
    ]
  });

  const handleSubmit = () => {
    // xtungvo TODO: define the schema
    onSubmit({
      id: uuidv4(),
      title,
      createdAt: new Date(),
      author: user?.username || '0x000000',
      content: updatingContent,
      preview: updatingPreview
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Bounty</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          id='title'
          label='Title'
          fullWidth
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          variant='standard'
        />

        {/* // xtungvo TODO: update to use our custome editor */}
        <BangleEditor state={editorState} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}
