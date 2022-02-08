import Card from '@mui/material/Card';
import { PropsWithChildren } from 'react';

function AccountCard ({ children }: PropsWithChildren<unknown>) {

  return (
    <Card>
      {children}
    </Card>
  );
}

export default AccountCard;
