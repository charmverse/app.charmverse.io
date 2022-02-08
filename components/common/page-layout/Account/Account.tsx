import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import Image from 'next/image';
import Avatar from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { Chains, RPC } from 'connectors';
import { LinkBreak, SignIn } from 'phosphor-react';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useContext } from 'react';
import { shortenHex } from 'lib/strings';
import AccountButton from './components/AccountButton';
import AccountCard from './components/AccountCard';
import AccountModal from './components/AccountModal';
import NetworkModal from './components/NetworkModal';
import useENSName from './hooks/useENSName';

function Account () {
  const { error, account, chainId } = useWeb3React();
  const { openWalletSelectorModal, triedEager, openNetworkModal } = useContext(Web3Connection);
  const ENSName = useENSName(account as string);
  const {
    isOpen: isAccountModalOpen,
    open: onAccountModalOpen,
    close: onAccountModalClose
  } = usePopupState({ variant: 'popover', popupId: 'account-modal' });
  const {
    isOpen: isNetworkModalOpen,
    open: onNetworkModalOpen,
    close: onNetworkModalClose
  } = usePopupState({ variant: 'popover', popupId: 'network-modal' });
  const [user] = useUser();
  const linkedAddressesCount = user?.linkedAddressesCount;

  if (typeof window === 'undefined') {
    return (
      <AccountCard>
        <AccountButton isLoading>Connect to a wallet</AccountButton>
      </AccountCard>
    );
  }

  if (error instanceof UnsupportedChainIdError) {
    return (
      <AccountCard>
        <AccountButton
          startIcon={<LinkBreak />}
          color='error'
          onClick={openNetworkModal}
        >
          Wrong Network
        </AccountButton>
      </AccountCard>
    );
  }
  if (!account) {
    return (
      <AccountCard>
        <AccountButton
          startIcon={<SignIn />}
          loading={!triedEager}
          onClick={openWalletSelectorModal}
        >
          Connect to a wallet
        </AccountButton>
      </AccountCard>
    );
  }
  return (
    <AccountCard>
      <ButtonGroup>
        <AccountButton onClick={onNetworkModalOpen}>
          {/* @ts-ignore */}
          <Tooltip label={RPC[Chains[chainId]].chainName}>
            {/* @ts-ignore */}
            <Image layout='fill' src={RPC[Chains[chainId]].iconUrls[0]} boxSize={4} />
          </Tooltip>
        </AccountButton>
        <Divider />
        <AccountButton onClick={onAccountModalOpen}>
          <Typography
            component='span'
          >
            {ENSName || `${shortenHex(account, 3)}`}
          </Typography>
          {/* {linkedAddressesCount && (
            <Typography
              component='span'
              color='white'
            >
              {`+ ${linkedAddressesCount} address${
                linkedAddressesCount > 1 ? 'es' : ''
              }`}
            </Typography>
          )} */}
          <Avatar name={account} />
        </AccountButton>
      </ButtonGroup>

      <AccountModal isOpen={isAccountModalOpen} onClose={onAccountModalClose} />
      <NetworkModal isOpen={isNetworkModalOpen} onClose={onNetworkModalClose} />
    </AccountCard>
  );
}

export default Account;
