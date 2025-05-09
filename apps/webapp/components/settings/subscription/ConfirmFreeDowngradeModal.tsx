import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';

const subscriptionCancellationDetails = {
  first: 'If you use the Free Edition, the following changes will apply: ',
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
  onConfirmDowngrade: () => void;
  disabled: boolean;
};
export function ConfirmFreeDowngradeModal({ isOpen, onClose, onConfirmDowngrade, disabled }: Props) {
  return (
    <ConfirmDeleteModal
      title='Confirm Free Edition downgrade'
      size='large'
      open={isOpen}
      buttonText='Downgrade to Free Edition'
      secondaryButtonText='Keep current plan'
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
      onConfirm={onConfirmDowngrade}
      onClose={onClose}
      disabled={disabled}
    />
  );
}
