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
import { useUser } from 'hooks/useUser';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { LoggedInUser } from 'models/User';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { WalletSign } from './WalletSign';

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
  const { loginFromWeb3Account } = useUser();

  const { loginWithGoogle } = useGoogleAuth();

  async function handleLogin(loggedInUser: AnyIdLogin) {
    log.debug('\r\nSuccess !!🚀🚀🚀', loggedInUser);
  }

  const handleClose = () => {
    onClose(selectedValue);
  };

  async function handleGoogleLogin() {
    const user = await loginWithGoogle();
    handleLogin(user);
  }

  async function handleWalletSign(signature: AuthSig) {
    const user = await loginFromWeb3Account(signature);
    handleLogin({ identityType: 'Wallet', user });
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Login</DialogTitle>
      <List sx={{ pt: 0 }}>
        {/** Web 3 login methods */}
        <ListItem>
          <WalletSign signSuccess={handleWalletSign} />
        </ListItem>

        <hr />

        {/* Google login method */}
        <ListItem button onClick={handleGoogleLogin}>
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
      <Button onClick={handleClickOpen} size='large' primary>
        Connect
      </Button>
      <SimpleDialog selectedValue={selectedValue} open={open} onClose={handleClose} />
    </div>
  );
}

export function Login() {
  return (
    <Box>
      <SimpleDialogDemo></SimpleDialogDemo>
    </Box>
  );
}
