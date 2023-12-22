import type { SxProps } from '@mui/material';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

import { CharmEditor } from 'components/common/CharmEditor';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';

import FieldLabel from '../FieldLabel';

type Props = {
  children?: ReactNode;
  label?: string;
  inline?: boolean;
  iconLabel?: ReactNode;
  required?: boolean;
  description?: PageContent;
  endAdornment?: ReactNode;
  sx?: SxProps;
};

export function FieldWrapper({ sx, endAdornment, description, required, children, label, inline, iconLabel }: Props) {
  if (!label) {
    return children as JSX.Element;
  }

  return (
    <Box flex={1} flexDirection={{ xs: 'column', sm: inline ? 'row' : 'column' }} display='flex' my={1} sx={sx}>
      {(label || !!iconLabel) && (
        <Box alignItems='center' display='flex' gap={1}>
          {iconLabel ?? null}
          {label && (
            <FieldLabel noWrap data-test='field-label'>
              {label}
              {required && (
                <Typography component='span' color='error'>
                  *
                </Typography>
              )}
              {endAdornment}
            </FieldLabel>
          )}
        </Box>
      )}
      {description && !checkIsContentEmpty(description as PageContent) ? (
        <CharmEditor readOnly isContentControlled content={description as PageContent} />
      ) : null}
      {children}
    </Box>
  );
}
