import { useState } from 'react';
import { PaymentMethod } from '@prisma/client';
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { Modal } from 'components/common/Modal';
import { CustomErcTokenForm } from 'components/common/form/CustomErcTokenForm';
import charmClient from 'charmClient';
import Legend from './Legend';
import Button from '../common/Button';

export default function PaymentMethodList ({ isAdmin = true }) {

  const [modalOpen, setModalOpen] = useState(false);

  const [paymentMethods, setPaymentMethods] = usePaymentMethods();

  async function addPaymentMethod (paymentMethod: Partial<PaymentMethod>) {
    setModalOpen(false);
    const _paymentMethod = await charmClient.createPaymentMethod(paymentMethod);
    console.log(_paymentMethod);
  }

  console.log('Available payment methods', paymentMethods);

  return (
    <>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <CustomErcTokenForm onSubmit={addPaymentMethod} />
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
    </>
  );
}

