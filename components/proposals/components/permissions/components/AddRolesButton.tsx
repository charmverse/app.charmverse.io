import { Button } from 'components/common/Button';

type Props = {
  onClick?: () => void;
  disabled?: boolean;
};

export function AddRolesButton({ disabled, onClick }: Props) {
  return (
    <Button disabled={disabled} onClick={onClick} variant='text' color='secondary'>
      + Add roles
    </Button>
  );
}
