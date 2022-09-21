import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import { Modal } from 'components/common/Modal';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Legend from '../Legend';
import CustomERCTokenForm from './components/CustomERCTokenForm';
import GnosisSafeForm from './components/GnosisSafeForm';
import PaymentMethodList from './components/PaymentMethodList';

export default function PaymentMethods () {

  const gnosisPopupState = usePopupState({ variant: 'popover', popupId: 'gnosis-popup' });
  const ERC20PopupState = usePopupState({ variant: 'popover', popupId: 'ERC20-popup' });

  const [paymentMethods,, refreshPaymentMethods] = usePaymentMethods();

  return (
    <>
      <Modal title='Add a custom ERC20 token' open={ERC20PopupState.isOpen} onClose={ERC20PopupState.close} size='500px'>
        <CustomERCTokenForm onSubmit={ERC20PopupState.close} />
      </Modal>
      <Modal title='Add a Gnosis Safe wallet' open={gnosisPopupState.isOpen} onClose={gnosisPopupState.close} size='500px'>
        <GnosisSafeForm
          onSubmit={() => {
            gnosisPopupState.close();
            refreshPaymentMethods();
          }}
        />
      </Modal>

      <Legend sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Payment Methods

        <Stack component='span' spacing={1} direction='row'>
          <Button
            onClick={ERC20PopupState.open}
            variant='outlined'
            sx={{ float: 'right' }}
          >
            Add custom token
          </Button>
        </Stack>

      </Legend>
      {paymentMethods.length > 0 && <PaymentMethodList paymentMethods={paymentMethods} />}
      {paymentMethods.length === 0 && <Typography color='secondary'>No payment methods yet</Typography>}
    </>
  );
}

