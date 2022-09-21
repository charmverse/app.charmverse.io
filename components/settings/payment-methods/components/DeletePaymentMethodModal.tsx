
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import charmClient from 'charmClient';
import type { ModalProps } from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useBounties } from 'hooks/useBounties';
import { usePaymentMethods } from 'hooks/usePaymentMethods';

type IProps = Pick<ModalProps, 'onClose' | 'open'> & {
  paymentMethodIdToDelete: string | null;
}

export default function CompositeDeletePaymentMethod ({
  onClose,
  open,
  paymentMethodIdToDelete
}: IProps) {

  const [paymentMethods, , refreshPaymentMethods] = usePaymentMethods();
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
    <ConfirmDeleteModal
      title='Delete payment method'
      onClose={onClose}
      open={open}
      buttonText={`Delete ${methodToDelete ? methodToDelete?.tokenSymbol : 'payment method'}`}
      onConfirm={deletePaymentMethod}
      question={
      !methodToDelete ? (
        <Typography>
          Payment method not found
        </Typography>
      ) : (
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
        </>
      )
    }
    />
  );
}

