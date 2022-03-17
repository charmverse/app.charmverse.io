import PaymentMethodList from 'components/settings/PaymentMethods/PaymentMethods';
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
