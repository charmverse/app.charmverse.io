
import { useWeb3React } from '@web3-react/core';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import CopyableAddress from 'components/common/CopyableAddress';
import Avatar from 'components/common/Avatar';
import { Modal, DialogTitle } from 'components/common/Modal';
import { injected, walletConnect, walletLink } from 'connectors';
import { useContext } from 'react';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import useENSName from 'hooks/useENSName';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { DiscordUser } from 'models/User';
import styled from '@emotion/styled';
// import AccountConnections from './components/AccountConnections';

const DiscordUserName = styled(Typography)`
  position: relative;
  top: 4px;
`;

function AccountModal ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { account, connector } = useWeb3React();
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const ENSName = useENSName(account);
  const [user] = useUser();
  const discordData = (user?.discord as unknown as DiscordUser);

  const handleWalletProviderSwitch = () => {
    openWalletSelectorModal();
    onClose();
  };

  const connectorName = (c: any) => {
    switch (c) {
      case injected:
        return 'MetaMask';
      case walletConnect:
        return 'WalletConnect';
      case walletLink:
        return 'Coinbase Wallet';
      default:
        return '';
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <DialogTitle onClose={onClose}>Account</DialogTitle>
      <Stack mb={9} direction='row' spacing='4' alignItems='center'>
        <Avatar name={ENSName || account} avatar={discordData?.avatar ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png` : null} />
        <CopyableAddress address={account!} decimals={5} sx={{ fontSize: 24 }} />
        {discordData && <DiscordUserName variant='subtitle2'>{discordData?.username}#{discordData?.discriminator}</DiscordUserName>}
      </Stack>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        my={1}
      >
        <Typography color='secondary'>
          {`Connected with ${connectorName(connector)}`}
        </Typography>
        <Button size='small' variant='outlined' onClick={handleWalletProviderSwitch}>
          Switch
        </Button>
      </Stack>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        my={1}
      >
        <Typography color='secondary'>
          {user!?.discord ? 'Connected with Discord' : 'Connect with Discord'}
        </Typography>
        <Button
          size='small'
          variant='outlined'
          onClick={async () => {
            const { redirectUrl } = await charmClient.discordLogin({
              href: window.location.href
            });
            window.location.replace(redirectUrl);
          }}
        >
          {user!?.discord ? 'Disconnect' : 'Connect'}
        </Button>
      </Stack>
    </Modal>
  );
}

export default AccountModal;
