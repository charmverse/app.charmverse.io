import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';

const subscriptionCancellationDetails = {
  first: 'If you use the Public Edition, the following changes will apply: ',
  list: [
    'All content will be public and shared on the web',
    'Custom roles will no longer apply',
    'All users will have the default member role',
    'Custom domains will be removed',
    'You will no longer have access to the public API',
    'You will still be able to use CharmVerse for your community but you will be working in public'
  ],
  last: 'If you upgrade to a paid plan in the future, all current permissions will be restored.'
};
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  disabled: boolean;
};
export function ConfirmFreeTierModal({ isOpen, onClose, onConfirm, disabled }: Props) {
  return (
    <ConfirmDeleteModal
      title='Confirm Public Edition'
      size='large'
      open={isOpen}
      buttonText='Switch to Public Edition'
      secondaryButtonText='Cancel'
      question={
        <>
          <Typography>{subscriptionCancellationDetails.first}</Typography>
          <List dense sx={{ listStyle: 'disc' }}>
            {subscriptionCancellationDetails.list.map((item) => (
              <ListItem key={item} sx={{ display: 'list-item', ml: '15px' }}>
                <ListItemText>{item}</ListItemText>
              </ListItem>
            ))}
          </List>
          <Typography>{subscriptionCancellationDetails.last}</Typography>
        </>
      }
      onConfirm={onConfirm}
      onClose={onClose}
      disabled={disabled}
    />
  );
}
