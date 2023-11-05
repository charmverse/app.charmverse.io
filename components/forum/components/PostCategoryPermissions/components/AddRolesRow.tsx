import Tooltip from '@mui/material/Tooltip';

import { Button } from 'components/common/Button';

type Props = {
  onClick?: () => void;
  disabled: boolean;
  disabledTooltip?: string;
};

export function AddRolesRow({ disabled, disabledTooltip, onClick }: Props) {
  return (
    <Tooltip title={disabledTooltip}>
      <div>
        <Button disabled={disabled} onClick={onClick} variant='text' color='secondary'>
          + Add roles
        </Button>
      </div>
    </Tooltip>
  );
}
