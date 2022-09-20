import PaymentMethodList from 'components/settings/payment-methods/PaymentMethods';
import SettingsLayout from 'components/settings/Layout';
import type { ReactElement } from 'react';

export default function PagePaymentMethods () {
  return (
    <PaymentMethodList />
  );
}

PagePaymentMethods.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
