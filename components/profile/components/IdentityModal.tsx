import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import TelegramIcon from '@mui/icons-material/Telegram';
import { Box, SvgIcon, Tooltip, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import type { IdentityType } from '@prisma/client';
import { utils } from 'ethers';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle, Modal } from 'components/common/Modal';
import { useUser } from 'hooks/useUser';
import randomName from 'lib/utilities/randomName';
import { shortWalletAddress } from 'lib/utilities/strings';
import DiscordIcon from 'public/images/discord_logo.svg';
import MetamaskIcon from 'public/images/metamask.svg';

import Integration from './Integration';

export type IntegrationModel = {
  username: string;
  secondaryUserName?: string;
  type: IdentityType;
  isInUse: boolean;
  icon: ReactNode;
};

export const getIdentityIcon = (identityType: IdentityType | null) => {
  switch (identityType) {
    case 'Wallet':
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#000000', minHeight: '40px', minWidth: '40px' }}>
          <MetamaskIcon />
        </SvgIcon>
      );

    case 'Discord':
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2', minHeight: '40px', minWidth: '40px' }}>
          <DiscordIcon />
        </SvgIcon>
      );

    case 'Telegram':
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#229ED9', minHeight: '40px', minWidth: '40px' }}>
          <TelegramIcon />
        </SvgIcon>
      );

    case 'UnstoppableDomain':
      return <img src='/images/walletLogos/unstoppable-domains.png' height={40} width={40} />;

    case 'Google':
      return <img src='/images/walletLogos/Google_G.png' height={40} width={40} />;

    case 'RandomName':
    default:
      return (
        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#777', minHeight: '40px', minWidth: '40px' }}>
          <PersonIcon />
        </SvgIcon>
      );
  }
};

type IdentityModalProps = {
  save: (username: string, identityType: IdentityType) => void;
  close: () => void;
  isOpen: boolean;
  identityTypes: IntegrationModel[];
  identityType: IdentityType;
};

function IdentityModal(props: IdentityModalProps) {
  const { close, isOpen, save, identityTypes, identityType } = props;

  const { setUser, user } = useUser();

  const [generatedName, setGeneratedName] = useState(
    user?.identityType === 'RandomName' && identityType === 'RandomName' ? user.username : randomName()
  );

  const [refreshingEns, setRefreshingEns] = useState(false);

  function refreshENSName(address: string) {
    setRefreshingEns(true);
    charmClient.blockchain
      .refreshENSName(address)
      .then((_user) => {
        setUser(_user);
      })
      .finally(() => {
        setRefreshingEns(false);
      });
  }

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        close();
        if (user?.identityType === 'RandomName') {
          setGeneratedName(user.username);
        }
      }}
      size='large'
    >
      <DialogTitle onClose={close}>Select a public identity</DialogTitle>
      <Typography>Select which integration you want to show as your username</Typography>
      <Box mb={2}>
        {identityTypes.map((item: IntegrationModel) => {
          const usernameToDisplay = item.type === 'RandomName' ? generatedName : item.username;
          return (
            <Integration
              isInUse={item.type === 'RandomName' && generatedName !== item.username ? false : item.isInUse}
              icon={item.icon}
              identityType={item.type}
              name={item.type === 'RandomName' ? 'Anonymous' : item.type}
              username={shortWalletAddress(usernameToDisplay)}
              secondaryUserName={item.secondaryUserName}
              useIntegration={() => save(usernameToDisplay, item.type)}
              action={
                item.type === 'RandomName' ? (
                  <Tooltip arrow placement='top' title='Generate a new name'>
                    <IconButton onClick={() => setGeneratedName(randomName())}>
                      <RefreshIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                ) : utils.isAddress(usernameToDisplay) ? (
                  <Tooltip
                    //                    disableHoverListener
                    onMouseEnter={(e) => e.stopPropagation()}
                    arrow
                    placement='top'
                    title={refreshingEns ? 'Looking up ENS Name' : 'Refresh ENS name'}
                  >
                    {refreshingEns ? (
                      <IconButton>
                        <LoadingComponent size={20} isLoading />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => refreshENSName(item.username)}>
                        <RefreshIcon fontSize='small' />
                      </IconButton>
                    )}
                  </Tooltip>
                ) : null
              }
              key={item.type}
            />
          );
        })}
      </Box>
      <Link href='/integrations'>
        <Button variant='text' color='secondary' endIcon={<NavigateNextIcon />}>
          Manage identities
        </Button>
      </Link>
    </Modal>
  );
}

export default IdentityModal;
