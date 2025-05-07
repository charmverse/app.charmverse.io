import { Stack, type SxProps } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { memo } from 'react';
import type { ReactNode } from 'react';

import { CharmEditor } from 'components/common/CharmEditor';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';

import FieldLabel from '../FieldLabel';

export type FieldWrapperProps = {
  children?: ReactNode;
  label?: string;
  inline?: boolean;
  sx?: SxProps;
};

export function FieldWrapperContainer({
  inline,
  sx,
  children
}: {
  inline?: boolean;
  sx?: SxProps;
  children: ReactNode;
}) {
  // 100% width is necessary to contain the charm editor input field inside its width
  return (
    <Box flex={1} flexDirection={{ xs: 'column', sm: inline ? 'row' : 'column' }} display='flex' width='100%' sx={sx}>
      {children}
    </Box>
  );
}

type ContentProps = {
  children?: ReactNode;
  iconLabel?: ReactNode;
  error?: boolean | string;
  required?: boolean;
  description?: PageContent;
  labelEndAdornment?: ReactNode;
  inputEndAdornment?: ReactNode;
  inputEndAdornmentAlignItems?: React.CSSProperties['alignItems'];
};

// a wrapper for FieldWrapper with props for label and description
function FieldWrapperComponent({
  sx,
  labelEndAdornment,
  description,
  required,
  children,
  label,
  inline,
  iconLabel,
  inputEndAdornment,
  error,
  inputEndAdornmentAlignItems = 'center'
}: ContentProps & FieldWrapperProps) {
  if (!label) {
    return children as JSX.Element;
  }

  return (
    <FieldWrapperContainer inline={inline} sx={sx}>
      {(label || !!iconLabel) && (
        <Box alignItems='center' display='flex' gap={1}>
          {iconLabel ?? null}
          {label && (
            <FieldLabel data-test='field-label' color={error ? 'error' : undefined}>
              {label}
              {required && (
                <Typography component='span' color='error'>
                  *
                </Typography>
              )}
              {labelEndAdornment}
            </FieldLabel>
          )}
        </Box>
      )}
      <ReadonlyCharmContent content={description} />
      <Stack alignItems={inputEndAdornmentAlignItems} flexDirection='row'>
        <div style={{ flexGrow: 1, overflowX: 'hidden' }}>{children}</div>
        {inputEndAdornment}
      </Stack>
    </FieldWrapperContainer>
  );
}

export const FieldWrapper = memo(FieldWrapperComponent);

export function ReadonlyCharmContent({ content }: { content?: PageContent | null }) {
  if (!content || checkIsContentEmpty(content)) {
    return null;
  }
  return (
    // Do not remove this div without testing PDF export on proposal forms first!
    // For unknown reasons, it prevents elements from being pushed down at the top of the exported pages
    <div>
      <CharmEditor readOnly isContentControlled content={content} />
    </div>
  );
}
