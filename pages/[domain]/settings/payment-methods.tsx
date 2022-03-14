import PaymentMethodList from 'components/settings/PaymentMethods';
import SettingsLayout from 'components/settings/Layout';
import { ReactElement } from 'react';

export default function PaymentMethods () {
  return (
    <PaymentMethodList />
  );
}

PaymentMethods.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
