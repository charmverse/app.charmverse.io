import { forwardRef } from 'react';

import { CharmEditor } from 'components/common/CharmEditor';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

type Props = ControlFieldProps & FieldProps & { multiline?: boolean; rows?: number };

export const CharmEditorInputField = forwardRef<HTMLDivElement, Props>(
  ({ placeholder, fieldWrapperSx, error, ...inputProps }) => {
    return (
      <FieldWrapper sx={fieldWrapperSx} {...inputProps}>
        <CharmEditor
          onContentChange={({ doc }) => {
            inputProps.onChange?.(doc);
          }}
          readOnly={inputProps.disabled}
          content={inputProps.value as PageContent}
          placeholderText={placeholder}
          disableNestedPages
          disablePageSpecificFeatures
          isContentControlled
          disableRowHandles
          style={{
            left: 0,
            backgroundColor: 'var(--input-bg)',
            border: error ? '1px solid var(--text-red)' : '1px solid var(--input-border)',
            minHeight: 150
          }}
        />
      </FieldWrapper>
    );
  }
);
