import { useTheme } from '@emotion/react';
import dynamic from 'next/dynamic';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

type Props = ControlFieldProps & FieldProps & { multiline?: boolean; rows?: number };

export const InlineCharmEditor = dynamic(() => import('components/common/CharmEditor/InlineCharmEditor'), {
  ssr: false
});

export const InlineCharmEditorInputField = forwardRef<HTMLDivElement, Props>(
  ({ placeholder, fieldWrapperSx, error, ...inputProps }) => {
    const theme = useTheme();

    return (
      <FieldWrapper sx={fieldWrapperSx} {...inputProps}>
        <InlineCharmEditor
          onContentChange={({ doc }) => {
            inputProps.onChange?.(doc);
          }}
          readOnly={inputProps.disabled}
          content={inputProps.value as PageContent}
          placeholderText={placeholder}
          style={{
            backgroundColor: 'var(--input-bg)',
            border: error ? '1px solid var(--text-red)' : '1px solid var(--input-border)',
            color: inputProps.disabled ? theme.palette.text.disabled : ''
          }}
        />
      </FieldWrapper>
    );
  }
);
