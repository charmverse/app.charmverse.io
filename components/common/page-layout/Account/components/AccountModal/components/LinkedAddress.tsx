
import CopyableAddress from 'components/common/CopyableAddress';
import GuildAvatar from 'components/common/Avatar';
import { Alert } from 'components/common/Modal';
import { useUser } from 'hooks/useUser';
import usePersonalSign from 'hooks/usePersonalSign';
import { useEffect, useRef } from 'react';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TrashSimpleIcon from '@mui/icons-material/Delete';
import Button from 'components/common/Button';
import { shortenHex } from 'lib/strings';
import useUpdateUser from '../hooks/useUpdateUser';

type Props = {
  address: string
}

function LinkedAddress ({ address }: Props) {
  const { isOpen, open, close } = usePopupState({ variant: 'popover', popupId: 'linked-address' });
  const { onSubmit, response, isLoading } = useUpdateUser();
  const alertCancelRef = useRef();
  const { isSigning } = usePersonalSign();

  const [user] = useUser();
  const { addresses = [] } = user || {};

  const removeAddress = () => onSubmit({
    addresses: addresses.filter((_address) => _address !== address)
  });

  useEffect(() => {
    if (response?.ok) close();
  }, [response, close]);

  return (
    <>
      <Box padding={4} display='flex' alignItems='center'>
        <GuildAvatar name={address} />
        <CopyableAddress address={address} decimals={5} />
        <Tooltip title='Remove address' placement='top' arrow>
          <IconButton
            size='small'
            color='error'
            onClick={open}
          >
            <TrashSimpleIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Alert open={isOpen} onClose={close}>
        {/* <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Remove address</AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You'll be kicked from the guilds you have the
              requirement(s) to with
              {' '}
              <Typography component='span'>
                {shortenHex(address, 3)}
              </Typography>
              .
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={alertCancelRef} onClick={close}>
                Cancel
              </Button>
              <Button
                colorScheme='red'
                onClick={removeAddress}
                isLoading={isLoading}
                loadingText={isSigning ? 'Check your wallet' : 'Removing'}
                ml={3}
              >
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay> */}
      </Alert>
    </>
  );
}

export default LinkedAddress;
