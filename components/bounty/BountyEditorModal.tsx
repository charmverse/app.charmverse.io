import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useUser } from 'hooks/useUser';

import { Button, TextField } from '@mui/material';

import { useEditorState, BangleEditor } from '@bangle.dev/react';
import { Plugin } from '@bangle.dev/core';
import { useState } from 'react';

interface Props {
  open: boolean
  onClose: () => void
  // xtungvo TODO: set the correct type
  onSubmit: (item: any) => void
}

export default function BountyEditorModal (props: Props) {
  const { open, onClose, onSubmit } = props;
  const [updatingContent, setUpdatingContent] = useState({});
  const [user] = useUser();
  const editorState = useEditorState({
    initialValue: 'Hello world!',
    plugins: () => [
      new Plugin({
        view: () => ({
          update: (view, prevState) => {
            if (!view.state.doc.eq(prevState.doc)) {
              setUpdatingContent(view.state.doc.toJSON());
            }
          }
        })
      })
    ]
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Bounty</DialogTitle>
      <DialogContent>
        {/* // xtungvo TODO: update title editor */}
        <TextField
          autoFocus
          margin='dense'
          id='title'
          label='Title'
          fullWidth
          variant='standard'
        />

        {/* // xtungvo TODO: update to use our custome editor */}
        <BangleEditor
          state={editorState}
        />

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
          // xtungvo TODO: define the schema
          onSubmit({ title: 'new one', createdAt: new Date(), author: user?.username || '0x000000', content: updatingContent });
        }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );

}
