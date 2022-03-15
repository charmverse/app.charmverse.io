import { useState } from 'react';
import { PaymentMethod } from '@prisma/client';
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getChainById } from 'connectors';
import { Modal } from 'components/common/Modal';
import { CustomErcTokenForm } from 'components/common/form/CustomErcTokenForm';
import charmClient from 'charmClient';
import Legend from '../Legend';
import Button from '../../common/Button';
import { CompositePaymentMethodList } from './CompositePaymentMethodList';

export default function PaymentMethodList ({ isAdmin = true }) {

  const [modalOpen, setModalOpen] = useState(false);

  const [paymentMethods, setPaymentMethods, refreshPaymentMethods] = usePaymentMethods();

  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);

  async function paymentMethodAdded (paymentMethod: Partial<PaymentMethod>) {
    setModalOpen(false);

  }

  console.log('Available payment methods', paymentMethods);

  return (
    <>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <CustomErcTokenForm onSubmit={paymentMethodAdded} />
      </Modal>

      <Legend>
        Payment Methods
        {isAdmin && (
        <Button
          onClick={() => setModalOpen(true)}
          variant='outlined'
          sx={{ float: 'right' }}
        >
          Add a payment method
        </Button>
        )}
      </Legend>

      <CompositePaymentMethodList paymentMethods={paymentMethods} />
    </>
  );
}

