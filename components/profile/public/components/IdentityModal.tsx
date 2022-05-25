import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Box, Button, Stack, SvgIcon, Typography } from '@mui/material';
import { Modal, DialogTitle } from 'components/common/Modal';
import DiscordIcon from 'public/images/discord_logo.svg';
import MetamaskIcon from 'public/images/metamask.svg';
import TelegramIcon from '@mui/icons-material/Telegram';
import Integration from './Integration';
import { INTEGRATION_TYPES, IntegrationType } from '../interfaces';

export const schema = yup.object({
  description: yup.string().ensure().trim()
    .nullable(true)
});

export type FormValues = yup.InferType<typeof schema>;

type IdentityModalProps = {
    defaultValues: Record<string, unknown>,
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
  }

  const useIntegration = (type: IntegrationType) => {

  };

  return (
    <Modal open={isOpen} onClose={close} size='large'>
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
            integrationType={INTEGRATION_TYPES[0]}
            name='Metamask'
            id='0x1234abcdefgh5678910hijklmnop980zxcvb23'
            useIntegration={useIntegration}
          />
          <Integration
            isInUse={false}
            icon={(
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2', height: '32px' }}>
                <DiscordIcon />
              </SvgIcon>
            )}
            integrationType={INTEGRATION_TYPES[1]}
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
            integrationType={INTEGRATION_TYPES[2]}
            name='Telegram'
            id='user#1234'
            useIntegration={useIntegration}
          />
          <Box justifyContent='end' mt={3} sx={{ display: 'flex' }}>
            <Link href='/profile/tasks'>
              <Button
                onClick={() => {
                }}
              >
                Manage Integrations
              </Button>
            </Link>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}

export default IdentityModal;
