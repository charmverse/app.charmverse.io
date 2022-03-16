import { PaymentMethod } from '@prisma/client';
import { CustomErcTokenForm } from 'components/settings/payment-methods/CompositeErc20PaymentMethodForm';
import { Modal } from 'components/common/Modal';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useState } from 'react';
import Button from '../../common/Button';
import Legend from '../Legend';
import { CompositePaymentMethodList } from './CompositePaymentMethodList';

export default function PaymentMethodList ({ isAdmin = true }) {

  const [modalOpen, setModalOpen] = useState(false);

  const [paymentMethods] = usePaymentMethods();

  async function paymentMethodAdded (paymentMethod: Partial<PaymentMethod>) {
    setModalOpen(false);
  }

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

