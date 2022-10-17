import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { ControlFieldProps, FieldProps, FieldType } from 'components/common/form/interfaces';

type Props = {
  type: FieldType;
} & FieldProps & ControlFieldProps;

export function FieldTypeRenderer ({ type, ...fieldProps }: Props) {
  switch (type) {
    case 'text':
    case 'phone':
    case 'url':
    case 'email': {
      return <TextInputField {...fieldProps} />;
    }
    case 'number': {
      return <NumberInputField {...fieldProps} />;
    }

    default: {
      return null;
    }
  }
}
