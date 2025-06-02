import { styled, Button } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Input from '@mui/material/OutlinedInput';
import { hasGuestAccess } from '@packages/subscriptions/featureRestrictions';

import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';

const StyledInput = styled(Input)`
  padding-right: 0;
  position: relative;

  .MuiInputAdornment-root {
    display: block;
    height: 100%;
    max-height: none;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 100px;
    text-align: right;
    button {
      height: 100%;
    }
  }
`;
type Props = {
  onClick?: () => void;
};

export function AddPagePermissionsInput({ onClick }: Props) {
  const { subscriptionTier } = useSpaceSubscription();
  const canAddGuests = hasGuestAccess(subscriptionTier);

  return (
    <StyledInput
      placeholder={canAddGuests ? 'Add people, roles or emails' : 'Add people or roles'}
      onClick={onClick}
      sx={{
        height: '35px',
        my: 1
      }}
      fullWidth
      readOnly
      endAdornment={
        <InputAdornment position='end'>
          <Button disableElevation>Invite</Button>
        </InputAdornment>
      }
    />
  );
}
