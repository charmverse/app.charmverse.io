import { useState } from 'react';
import { PaymentMethod } from '@prisma/client';
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getChainById } from 'connectors';
import { Modal, ModalProps, DialogTitle } from 'components/common/Modal';
import { CustomErcTokenForm } from 'components/common/form/CustomErcTokenForm';
import charmClient from 'charmClient';
import { getPaymentMethod } from 'lib/tokens/tokenData';
import Alert from '@mui/material/Alert';
import { useBounties } from 'hooks/useBounties';
import Button from 'components/common/Button';
import Legend from '../Legend';
import { CompositePaymentMethodList } from './CompositePaymentMethodList';

type IProps = Pick<ModalProps, 'onClose' | 'open'> & {
  paymentMethodIdToDelete: string,
}

export function CompositeDeletePaymentMethod ({
  onClose,
  open,
  paymentMethodIdToDelete
}: IProps) {

  const [paymentMethods, _, refreshPaymentMethods] = usePaymentMethods();
  const { bounties } = useBounties();

  const methodToDelete = getPaymentMethod(paymentMethods, paymentMethodIdToDelete);

  async function deletePaymentMethod () {
    if (methodToDelete) {
      await charmClient.deletePaymentMethod(methodToDelete.id);
    }
    refreshPaymentMethods();
    onClose();
  }

  const usedByBounty = methodToDelete ? !!bounties.find(bounty => {
    return bounty.rewardToken === methodToDelete.contractAddress;
  }) : false;

  return (
    <Modal
      open={open}
      onClose={onClose}
    >

      <DialogTitle onClose={onClose}>Delete payment method</DialogTitle>

      {
          !methodToDelete && (
            <Typography>
              Payment method not found
            </Typography>
          )
        }
      {
          methodToDelete && (
            <>

              {
                usedByBounty && (
                  <Alert severity='warning' sx={{ mb: 1 }}>
                    <Box component='p' sx={{ mb: 1 }}>
                      This payment method has been used by a bounty in this workspace.
                    </Box>
                    <Box component='p'>
                      If you delete this payment method, token information will not show in the bounty.
                    </Box>

                  </Alert>
                )
              }

              <Typography>
                {
                  `Are you sure you want to delete the ${methodToDelete.tokenSymbol} payment method?`
                }

              </Typography>

              <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
                <Button
                  color='error'
                  sx={{ mr: 2, fontWeight: 'bold' }}
                  onClick={deletePaymentMethod}
                >
                  {`Delete ${methodToDelete.tokenSymbol}`}
                </Button>

                <Button color='secondary' onClick={onClose}>Cancel</Button>
              </Box>
            </>
          )
        }

    </Modal>
  );
}

