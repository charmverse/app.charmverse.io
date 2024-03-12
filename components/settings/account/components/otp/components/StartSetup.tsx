import LockIcon from '@mui/icons-material/Lock';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { Button } from 'components/common/Button';

type Props = {
  onSubmit: () => void;
  loading?: boolean;
  errorMessage?: string;
};

export function StartSetup({ onSubmit, loading, errorMessage }: Props) {
  return (
    <List sx={{ '.MuiListItemText-root': { mt: 0 }, '.MuiListItem-root': { py: 1 } }}>
      <ListItem>
        <ListItemIcon>
          <LockIcon sx={{ fontSize: 35, mr: 2 }} />
        </ListItemIcon>
        <ListItemText primary='Protect your account in just two steps' />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Typography
            component='span'
            mr={2}
            display='flex'
            border={(theme) => `3px solid ${theme.palette.secondary.dark}`}
            borderRadius='50%'
            width='35px'
            height='35px'
            textAlign='center'
            alignItems='center'
            justifyContent='center'
            variant='body2'
          >
            1
          </Typography>
        </ListItemIcon>
        <ListItemText
          primary='Link your authentication app'
          secondary='Use a compatible authentication app (like Google Authenticator, Authy, Duo Mobile, 1Password, etc). We’ll generate a QR Code for you to scan.'
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Typography
            component='span'
            mr={2}
            display='flex'
            border={(theme) => `3px solid ${theme.palette.secondary.dark}`}
            borderRadius='50%'
            width='35px'
            height='35px'
            textAlign='center'
            alignItems='center'
            justifyContent='center'
            variant='body2'
          >
            2
          </Typography>
        </ListItemIcon>
        <ListItemText
          primary='Protect your account in just two steps'
          secondary='Two-factor authentication will then be turned on for authentication app.'
        />
      </ListItem>
      <ListItem sx={{ justifyContent: 'center' }}>
        <Button onClick={onSubmit} loading={loading} disabled={loading} data-test='two-factor-auth-next'>
          Get started
        </Button>
        {errorMessage && <Typography color='error'>{errorMessage}</Typography>}
      </ListItem>
    </List>
  );
}
