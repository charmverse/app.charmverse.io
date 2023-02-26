import type { RegisterOptions } from 'react-hook-form';

import type { FieldType } from 'components/common/form/interfaces';
import { isValidUrl } from 'lib/utilities/isValidUrl';

export function getFieldTypeRules(type: FieldType): RegisterOptions {
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
        pattern:
          /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i
      };
    }

    case 'url': {
      return {
        required: false,
        validate: (val: string) => {
          if (!val) {
            return true;
          }

          return isValidUrl(val);
        }
      };
    }

    default: {
      return {};
    }
  }
}
