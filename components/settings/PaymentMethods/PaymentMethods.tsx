import { PaymentMethod } from '@prisma/client';
import CustomErcTokenForm from 'components/settings/PaymentMethods/components/PaymentMethodForm';
import { Modal } from 'components/common/Modal';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useState } from 'react';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import Legend from '../Legend';
import PaymentMethodList from './components/PaymentMethodList';

export default function PaymentMethods ({ isAdmin = true }) {

  const [modalOpen, setModalOpen] = useState(false);

  const [paymentMethods] = usePaymentMethods();

  async function paymentMethodAdded (paymentMethod: Partial<PaymentMethod>) {
    setModalOpen(false);
  }

  return (
    <>
      <Modal title='Add a payment method' open={modalOpen} onClose={() => setModalOpen(false)} size='500px'>
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
      {paymentMethods.length > 0 && <PaymentMethodList paymentMethods={paymentMethods} />}
      {paymentMethods.length === 0 && <Typography color='secondary'>No payment methods yet</Typography>}
    </>
  );
}

