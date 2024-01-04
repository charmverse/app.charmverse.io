import type { SxProps } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { CharmEditor } from 'components/common/CharmEditor';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import type { PageContent } from 'lib/prosemirror/interfaces';

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
  return (
    <Box flex={1} flexDirection={{ xs: 'column', sm: inline ? 'row' : 'column' }} display='flex' sx={sx}>
      {children}
    </Box>
  );
}

type ContentProps = {
  children?: ReactNode;
  iconLabel?: ReactNode;
  required?: boolean;
  description?: PageContent;
  endAdornment?: ReactNode;
};

// a wrapper for FieldWrapper with props for label and description
export function FieldWrapper({
  sx,
  endAdornment,
  description,
  required,
  children,
  label,
  inline,
  iconLabel
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
            <FieldLabel data-test='field-label'>
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
      <ReadonlyCharmContent content={description} />
      {children}
    </FieldWrapperContainer>
  );
}

export function ReadonlyCharmContent({ content }: { content?: PageContent | null }) {
  if (!content || checkIsContentEmpty(content)) {
    return null;
  }
  return <CharmEditor readOnly isContentControlled content={content} />;
}
