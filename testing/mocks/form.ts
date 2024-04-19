import { v4 as uuid } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';

export function getFormInput(input: Partial<FormFieldInput>): FormFieldInput {
  return {
    id: uuid(),
    type: 'short_text',
    name: 'name',
    description: '',
    index: 0,
    options: [],
    private: false,
    required: true,
    fieldConfig: {},
    ...input
  };
}
