import BangleEditor from 'components/editor/BangleEditor';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Box, Button, DialogContentText, TextField, Typography } from '@mui/material';

interface Props {
  open: boolean
  item: any
  onClose: () => void
  submit: (item: any) => void
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
  const { open, item, onClose, submit } = props;
  console.log('objeczzzzzzzt', item.content);
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
        <BangleEditor content={item.content} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => { }}>Submit</Button>
      </DialogActions>
    </Dialog>
  );

}
