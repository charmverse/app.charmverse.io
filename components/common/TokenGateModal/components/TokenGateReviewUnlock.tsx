import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { useSnackbar } from 'hooks/useSnackbar';
import UnlockProtocolIcon from 'public/images/logos/unlock_protocol_logo.svg';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateReviewUnlock() {
  const { lock, resetModal, onSubmit, loadingToken } = useTokenGateModal();
  const { showMessage } = useSnackbar();

  if (!lock) {
    return null;
  }

  const onSubmitCondition = async () => {
    await onSubmit('unlock');
    showMessage('Token gate created successfully', 'success');
  };

  return (
    <>
      <Typography>Review your conditions and confirm</Typography>
      <Card variant='outlined' color='default'>
        <CardContent>
          <Box display='flex' alignItems='center' gap={1}>
            {lock.image ? (
              <Image
                src={lock.image}
                width={35}
                height={35}
                alt={lock.name}
                style={{
                  borderRadius: 10,
                  objectFit: 'cover'
                }}
              />
            ) : (
              <SvgIcon component={UnlockProtocolIcon} inheritViewBox width={35} height={35} />
            )}
            <Typography>Unlock Protocol - {lock.name}</Typography>
          </Box>
        </CardContent>
      </Card>
      <TokenGateFooter onSubmit={onSubmitCondition} onCancel={resetModal} loading={loadingToken} />
    </>
  );
}
