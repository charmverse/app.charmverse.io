import { useTheme } from '@emotion/react';

import { CharmEditor } from 'components/common/CharmEditor';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

type Props = ControlFieldProps & FieldProps & { multiline?: boolean; rows?: number };

export function CharmEditorInputField({ placeholder, error, ...inputProps }: Props) {
  const theme = useTheme();
  return (
    <FieldWrapper inputEndAdornmentAlignItems='flex-start' {...inputProps} error={!!error}>
      <CharmEditor
        onContentChange={({ doc, rawText }) => {
          inputProps.onChange?.({ content: doc, contentText: rawText });
        }}
        readOnly={inputProps.disabled}
        content={(inputProps.value as { content: PageContent; contentText: string })?.content ?? undefined}
        placeholderText={placeholder}
        disableNestedPages
        disablePageSpecificFeatures
        isContentControlled
        disableRowHandles
        style={{
          left: 0,
          backgroundColor: 'var(--input-bg)',
          border: error ? `1px solid ${theme.palette.error.main}` : '1px solid var(--input-border)',
          minHeight: 150,
          color: inputProps.disabled ? theme.palette.text.disabled : '',
          borderRadius: theme.spacing(0.5)
        }}
      />
    </FieldWrapper>
  );
}
