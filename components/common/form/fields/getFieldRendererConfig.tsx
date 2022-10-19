
import type { JSXElementConstructor, ReactElement } from 'react';
import type { RegisterOptions } from 'react-hook-form';

import { FieldTypeRenderer } from 'components/common/form/fields/FieldTypeRenderer';
import type { ControlFieldProps, FieldProps, FieldType } from 'components/common/form/interfaces';

type Props = {
  type: FieldType;
} & FieldProps;

type FieldRenderedConfig = {
  rules: RegisterOptions;
  renderer: (fieldProps: { field: ControlFieldProps }) => ReactElement<any, string | JSXElementConstructor<any>>;
}

export function getFieldRendererConfig ({ type, ...fieldProps }: Props): FieldRenderedConfig {
  return {
    rules: getFieldTypeRules(type),
    renderer: ({ field }: { field: ControlFieldProps }) => <FieldTypeRenderer {...field} {...fieldProps} type={type} />
  };
}

function getFieldTypeRules (type: FieldType): RegisterOptions {
  // return validation rules for field like email etc
  switch (type) {
    case 'number': {
      return {
        required: false,
        pattern: /^(0|[1-9]\d*)(\.\d+)?$/
      };
    }

    case 'phone': {
      return {
        required: false,
        pattern: /^(0|[1-9]\d*)(\.\d+)?$/
      };
    }

    case 'email': {
      return {
        required: false,
        pattern: /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i
      };
    }

    case 'url': {
      return {
        required: false,
        validate: (val: string) => {
          if (!val) {
            return true;
          }

          try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
          }
          catch (_) {
            return false;
          }
        }
      };
    }

    default: {
      return {};
    }
  }
}
