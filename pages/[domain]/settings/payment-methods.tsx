import PaymentMethodList from 'components/settings/payment-methods/WidgetPaymentMethods';
import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';

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
