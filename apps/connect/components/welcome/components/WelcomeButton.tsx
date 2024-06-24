import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';
import { useFormStatus } from 'react-dom';

export function WelcomeButton({ disabled, ...restProps }: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} {...restProps}>
      Next
    </Button>
  );
}
