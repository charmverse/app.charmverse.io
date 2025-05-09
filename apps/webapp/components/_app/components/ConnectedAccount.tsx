import { Stack } from '@mui/system';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';

export function ConnectedAccount({
  icon,
  label,
  required,
  disabled,
  children,
  onClick,
  loading
}: {
  required: boolean;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  onClick?: VoidFunction;
  loading?: boolean;
}) {
  return (
    <Stack gap={1} minWidth={275} width='fit-content'>
      <FieldWrapper label={label} required={required}>
        <Button loading={loading} onClick={onClick} color='secondary' variant='outlined' disabled={disabled}>
          <Stack flexDirection='row' alignItems='center' justifyContent='space-between' width='100%' gap={2}>
            {children}
            {!loading ? icon : null}
          </Stack>
        </Button>
      </FieldWrapper>
    </Stack>
  );
}
