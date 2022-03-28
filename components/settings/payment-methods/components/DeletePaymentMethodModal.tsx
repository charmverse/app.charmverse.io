
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { Modal, ModalProps, DialogTitle } from 'components/common/Modal';
import charmClient from 'charmClient';
import Alert from '@mui/material/Alert';
import { useBounties } from 'hooks/useBounties';
import Button from 'components/common/Button';

type IProps = Pick<ModalProps, 'onClose' | 'open'> & {
  paymentMethodIdToDelete: string | null;
}

export default function CompositeDeletePaymentMethod ({
  onClose,
  open,
  paymentMethodIdToDelete
}: IProps) {

  const [paymentMethods, _, refreshPaymentMethods] = usePaymentMethods();
  const { bounties } = useBounties();

  const methodToDelete = paymentMethods.find(method => method.id === paymentMethodIdToDelete);

  async function deletePaymentMethod () {
    if (methodToDelete) {
      await charmClient.deletePaymentMethod(methodToDelete.id);
    }
    refreshPaymentMethods();
    onClose();
  }

  const usedByBounty = methodToDelete ? bounties.some(bounty => {
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
              {`Are you sure you want to delete the ${methodToDelete.tokenSymbol} payment method?`}
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

