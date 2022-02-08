import {
  Grid,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import Button from 'components/common/Button';
import { useWeb3React } from '@web3-react/core';
import Section from 'components/common/Section';
import { useUser } from 'hooks/useUser';
import usePersonalSign from 'hooks/usePersonalSign';
import LinkedAddress from './LinkedAddress';

function AccountConnections () {
  const [user] = useUser();
  const { isLoading, addresses, linkedAddressesCount, discordId } = user || {};
  const { addressSignedMessage, sign, isSigning } = usePersonalSign();
  const { account } = useWeb3React();

  return (
    <Box padding='10'>
      {/* <Section title="Connected Discord account">
        {!addressSignedMessage ? (
          <Typography color='secondary'>
            Hidden. Verify that you're the owner of this account below to view
          </Typography>
        ) : (
          <Typography color='secondary'>Account id: {discordId}</Typography>
        )}
      </Section> */}
      <Section
        title='Linked addresses'
      >
        {isLoading && !addresses ? (
          <CircularProgress />
        ) : !linkedAddressesCount ? (
          <Typography color='secondary'>
            If you join a guild with another address, but with the same Discord
            account, your addresses will be linked together and each will be used for
            requirement checks.
          </Typography>
        ) : !Array.isArray(addresses) ? (
          <Typography color='secondary'>
            {linkedAddressesCount}
            {' '}
            address
            {linkedAddressesCount > 1 && 'es'}
            {' '}
            hidden.
            Verify that you're the owner of this account below to view
            {' '}
            {linkedAddressesCount > 1 ? 'them' : 'it'}
          </Typography>
        ) : (
          <Box padding={4} mt='2'>
            {addresses
              .filter((address) => address?.toLowerCase() !== account?.toLowerCase())
              .map((address) => (
                <LinkedAddress key={address} address={address} />
              ))}
          </Box>
        )}
      </Section>
      {!addressSignedMessage && linkedAddressesCount && (
        <Button
          onClick={() => sign()}
          isLoading={isSigning}
          loadingTypography='Check your wallet'
        >
          Sign message to verify address
        </Button>
      )}
    </Box>
  );
}

export default AccountConnections;
