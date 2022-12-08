import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import { blue } from '@mui/material/colors';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { IdentityType } from '@prisma/client';
import * as React from 'react';

import Button from 'components/common/Button';
import type { LoggedInUser } from 'models/User';

import { useGoogleAuth } from './hooks/useGoogleAuth';

// Google client setup end
const emails = ['username@gmail.com', 'user02@gmail.com'];
export type AnyIdLogin = { identityType: IdentityType; user: LoggedInUser };
export type AnyIdFunction = () => Promise<AnyIdLogin>;
export interface SimpleDialogProps {
  open: boolean;
  selectedValue: string;
  onClose: (value: string) => void;
}

function SimpleDialog(props: SimpleDialogProps) {
  const { onClose, selectedValue, open } = props;

  const { loginWithGoogle } = useGoogleAuth();

  async function handleLogin(loggedInUser: AnyIdLogin) {
    log.debug('\r\nSuccess !!🚀🚀🚀', loggedInUser);
  }

  const handleClose = () => {
    onClose(selectedValue);
  };
  const handleListItemClick = (value: string) => {
    onClose(value);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Login</DialogTitle>
      <List sx={{ pt: 0 }}>
        <ListItem button onClick={() => loginWithGoogle().then(handleLogin)}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
              <PersonIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary='Login with Google' />
        </ListItem>
      </List>
      <DialogTitle>With web 2</DialogTitle>
      <List sx={{ pt: 0 }}>
        <ListItem button onClick={() => loginWithGoogle().then(handleLogin)}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: blue[100], color: blue[600] }}>
              <PersonIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary='Login with Google' />
        </ListItem>
      </List>
    </Dialog>
  );
}

export default function SimpleDialogDemo() {
  const [open, setOpen] = React.useState(true);
  const [selectedValue, setSelectedValue] = React.useState(emails[1]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (value: string) => {
    setOpen(false);
    setSelectedValue(value);
  };

  return (
    <div>
      <Typography variant='subtitle1' component='div'>
        Selected: {selectedValue}
      </Typography>
      <br />
      <Button variant='outlined' onClick={handleClickOpen}>
        Open simple dialog
      </Button>
      <SimpleDialog selectedValue={selectedValue} open={open} onClose={handleClose} />
    </div>
  );
}

export function Login() {
  return (
    <Box>
      <Button size='large' primary>
        Connect with any ID
      </Button>

      <SimpleDialogDemo></SimpleDialogDemo>
    </Box>
  );
}
