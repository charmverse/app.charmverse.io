import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Box, Button, DialogContentText, TextField, Typography } from '@mui/material';

import { useEditorState, BangleEditor } from '@bangle.dev/react';
import { Plugin } from '@bangle.dev/core';
import { floatingMenu, FloatingMenu } from '@bangle.dev/react-menu';
import {
  bold,
  listItem,
  bulletList,
  orderedList
} from '@bangle.dev/base-components';
import { useState } from 'react';

interface Props {
  open: boolean
  item: any
  onClose: () => void
  onSubmit: (item: any) => void
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4
};

export default function BountyEditorModal (props: Props) {
  const { open, item, onClose, onSubmit } = props;
  const [updatingContent, setUpdatingContent] = useState({});
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
        <DialogContentText>
          To subscribe to this website, please enter your email address here. We
          will send updates occasionally.
        </DialogContentText>
        <TextField
          autoFocus
          margin='dense'
          id='title'
          label='Title'
          fullWidth
          variant='standard'
        />
        <BangleEditor
          state={editorState}
        />

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
          onSubmit({ title: 'new one', createdAt: new Date(), author: '0x000000', content: updatingContent });
        }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );

}
