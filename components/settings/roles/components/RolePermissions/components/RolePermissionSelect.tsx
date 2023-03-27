import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { SmallSelect } from 'components/common/form/InputEnumToOptions';

type Props<T extends string> = {
  label: T;
  friendlyValue: string;
  options: Record<T, string>;
  defaultValue: T;
  onChange: (value: T) => void;
  readOnly: boolean;
};

export function RolePermissionSelect<T extends string = string>(props: Props<T>) {
  return (
    <Box display='flex' justifyContent='space-between' alignItems='center'>
      <Typography variant='body2'>{props.label as ReactNode}</Typography>
      <div style={{ width: '160px', textAlign: 'right' }}>
        {!props.readOnly ? (
          <SmallSelect<T> onChange={props.onChange} keyAndLabel={props.options} defaultValue={props.defaultValue} />
        ) : (
          <Typography color='secondary' variant='caption'>
            {props.friendlyValue}
          </Typography>
        )}
      </div>
    </Box>
  );
}
