import Button, { InputProps } from 'components/common/Button';
import { ComponentProps } from 'react';

type ButtonProps = ComponentProps<typeof Button>;

function AccountButton ({ children, ...rest }: ButtonProps) {
  return (
    <Button
      sx={{
        borderRadius: 'md'
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}

export default AccountButton;
