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
import type { IdentityType } from '@prisma/client';
import * as React from 'react';
import { useState } from 'react';

import Button from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { LoggedInUser } from 'models/User';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { WalletSign } from './WalletSign';

export type AnyIdLogin = { identityType: IdentityType; user: LoggedInUser };
export type AnyIdFunction = () => Promise<AnyIdLogin>;
export interface DialogProps {
  open: boolean;
  selectedValue: string;
  onClose: (value: string) => void;
}

function LoginHandler(props: DialogProps) {
  const { onClose, selectedValue, open } = props;
  const { loginFromWeb3Account } = useUser();

  const { showMessage } = useSnackbar();

  const { loginWithGoogle } = useGoogleAuth();

  async function handleLogin(loggedInUser: AnyIdLogin) {
    showMessage(`Logged in with ${loggedInUser.identityType}. Redirecting you now`, 'success');
    window.location.reload();
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

export function Login() {
  const [open, setOpen] = useState(true);
  const [selectedValue, setSelectedValue] = useState('');

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
      <LoginHandler selectedValue={selectedValue} open={open} onClose={handleClose} />
    </div>
  );
}
