import { DateInputField } from 'components/common/form/fields/DateInputField';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectField } from 'components/common/form/fields/SelectField';
import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProposalFormFieldInput } from './interfaces';

export interface FormFieldInputProps {
  formField: ProposalFormFieldInput;
  onCreateOption?: (option: SelectOptionType) => void;
  onDeleteOption?: (option: SelectOptionType) => void;
  onUpdateOption?: (option: SelectOptionType) => void;
}

export function EditableFormFieldInput({
  formField,
  onCreateOption,
  onDeleteOption,
  onUpdateOption
}: FormFieldInputProps) {
  const { type, options = [] } = formField;
  switch (type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
    case 'label':
    case 'text_multiline':
    case 'wallet': {
      return (
        <TextInputField
          disabled
          placeholder='Your answer'
          multiline={type === 'text_multiline'}
          rows={type === 'text_multiline' ? 3 : 1}
        />
      );
    }
    case 'number': {
      return <NumberInputField disabled placeholder='Your answer' />;
    }
    case 'date': {
      return <DateInputField value={new Date().toString()} disabled placeholder='Your answer' />;
    }
    case 'select':
    case 'multiselect': {
      return (
        <SelectField
          multiselect={type === 'multiselect'}
          placeholder='Your answer'
          value=''
          options={options}
          onCreateOption={onCreateOption}
          onDeleteOption={onDeleteOption}
          onUpdateOption={onUpdateOption}
        />
      );
    }
    case 'person': {
      return <SelectField placeholder='Your answer' value='' disabled options={[]} />;
    }
    default: {
      return null;
    }
  }
}

export function FormFieldInput({ formField }: { formField: ProposalFormFieldInput }) {
  const { type, description, name, required, options = [] } = formField;

  switch (type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
    case 'label':
    case 'text_multiline':
    case 'wallet': {
      return (
        <TextInputField
          disabled
          description={description ?? ''}
          placeholder='Your answer'
          multiline={type === 'text_multiline'}
          rows={type === 'text_multiline' ? 3 : 1}
          required={required}
          label={name}
        />
      );
    }
    case 'number': {
      return (
        <NumberInputField
          label={name}
          required={required}
          description={description ?? ''}
          disabled
          placeholder='Your answer'
        />
      );
    }
    case 'date': {
      return (
        <DateInputField
          label={name}
          required={required}
          value={new Date().toString()}
          onChange={() => {}}
          disabled
          placeholder='Your answer'
          description={description ?? ''}
        />
      );
    }
    case 'select':
    case 'multiselect': {
      return (
        <SelectField
          multiselect={type === 'multiselect'}
          options={options}
          placeholder='Your answer'
          onChange={() => {}}
          value=''
          required={required}
          label={name}
          description={description ?? ''}
          disabled
        />
      );
    }
    case 'person': {
      return <SelectField placeholder='Your answer' value='' disabled options={[]} />;
    }
    default: {
      return null;
    }
  }
}
