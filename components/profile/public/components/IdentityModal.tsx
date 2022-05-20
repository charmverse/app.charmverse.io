import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Box, Button, Divider, Grid, Stack, SvgIcon, TextField, Typography } from '@mui/material';
import { Modal, DialogTitle } from 'components/common/Modal';
import DiscordIcon from 'public/images/discord_logo.svg';
import MetamaskIcon from 'public/images/metamask.svg';
import TelegramIcon from '@mui/icons-material/Telegram';
import log from 'lib/log';
import Integration from './Integration';
import { IntegrationType } from '../enums';

const StyledButton = styled(Button)`
    border-radius: 7px;
    background-color: #F7F7F5;
    color: gray;

    &:hover {
      background-color: #F7F7F5;
    }
`;

export const schema = yup.object({
  description: yup.string().ensure().trim()
    .nullable(true)
});

export type FormValues = yup.InferType<typeof schema>;

type IdentityModalProps = {
    defaultValues: { },
    close: () => void,
    isOpen: boolean,
};

function IdentityModal (props: IdentityModalProps) {
  const { defaultValues, close, isOpen } = props;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema)
  });

  function onSubmit (values: FormValues) {
    try {
    }
    catch (err) {
      log.error('Error updating description', err);
    }
  }

  const useIntegration = (type: IntegrationType) => {

  };

  return (
    <Modal open={isOpen} onClose={() => {}} size='large'>
      <DialogTitle onClose={close}>Public Identity</DialogTitle>
      <Typography>Select which integration you want to show as your public identity</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack mt={2}>
          <Integration
            isInUse={true}
            icon={(
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#000000', height: '32px' }}>
                <MetamaskIcon />
              </SvgIcon>
            )}
            integrationType={IntegrationType.Metamask}
            name='Metamask'
            id='0x1234abcdefgh5678910hijklmnop980zxcvb23'
            useIntegration={useIntegration}
          />
          <Integration
            isInUse={false}
            icon={(
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#000000', height: '32px' }}>
                <DiscordIcon />
              </SvgIcon>
            )}
            integrationType={IntegrationType.Discord}
            name='Discord'
            id='user#1234'
            useIntegration={useIntegration}
          />
          <Integration
            isInUse={false}
            icon={(
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#229ED9', height: '32px' }}>
                <TelegramIcon />
              </SvgIcon>
            )}
            integrationType={IntegrationType.Discord}
            name='Telegram'
            id='user#1234'
            useIntegration={useIntegration}
          />
          <Box justifyContent='end' mt={3} sx={{ display: 'flex' }}>
            <Link href='/profile/tasks'>
              <StyledButton
                onClick={() => {
                }}
              >
                Manage Integrations
              </StyledButton>
            </Link>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}

export default IdentityModal;
