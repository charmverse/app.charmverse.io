import { capitalize } from 'lodash';
import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';
import { members } from 'stories/lib/mockData';
import { v4 } from 'uuid';

import { formFieldTypes } from 'components/common/form/constants';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { FormFieldInputs as CustomFormFieldInputs } from 'components/common/form/FormFieldInputs';
import { FormFieldsEditor as CustomFormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import type { FormFieldInput, TFormFieldInput } from 'components/common/form/interfaces';
import { createDocumentWithText } from 'lib/prosemirror/constants';
import { brandColorNames } from 'theme/colors';

export function FormFieldsEditor() {
  const field: FormFieldInput = {
    description: 'This is a description',
    index: 0,
    name: 'Title',
    options: [],
    private: false,
    required: true,
    type: 'short_text',
    id: v4()
  };
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<string[]>([field.id]);
  const [formFields, setFormFields] = useState<FormFieldInput[]>([field]);

  return (
    <GlobalContext>
      <CustomFormFieldsEditor
        formFields={formFields}
        setFormFields={setFormFields}
        collapsedFieldIds={collapsedFieldIds}
        toggleCollapse={(fieldId) => {
          if (collapsedFieldIds.includes(fieldId)) {
            setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
          } else {
            setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
          }
        }}
      />
    </GlobalContext>
  );
}

export function FormFieldsInputs() {
  return (
    <GlobalContext>
      <CustomFormFieldInputs
        onSave={() => {}}
        formFields={formFieldTypes.map((formFieldType, index) => {
          const options: SelectOptionType[] = [];
          if (formFieldType.match(/select|multiselect/)) {
            // Random number between 3 and 5
            const totalOptions = Math.floor(Math.random() * (5 - 3 + 1) + 3);
            for (let i = 0; i < totalOptions; i++) {
              options.push({
                id: v4(),
                name: `Option ${i + 1}`,
                color: brandColorNames[Math.floor(Math.random() * brandColorNames.length)]
              });
            }
          }
          const label = capitalize(formFieldType.replaceAll(/_/g, ' '));
          return {
            description: `This is a description for ${label.toLocaleLowerCase()}`,
            name: `${label} title`,
            options,
            private: index % 2 !== 0,
            required: index % 2 !== 0,
            type: formFieldType,
            id: v4(),
            value: ''
          };
        })}
      />
    </GlobalContext>
  );
}

export function FormFieldsInputsDisplay() {
  return (
    <GlobalContext>
      <CustomFormFieldInputs
        formFields={formFieldTypes.map((formFieldType, index) => {
          const options: SelectOptionType[] = [];
          if (formFieldType.match(/select|multiselect/)) {
            // Random number between 3 and 5
            const totalOptions = Math.floor(Math.random() * (5 - 3 + 1) + 3);
            for (let i = 0; i < totalOptions; i++) {
              options.push({
                id: v4(),
                name: `Option ${i + 1}`,
                color: brandColorNames[Math.floor(Math.random() * brandColorNames.length)]
              });
            }
          }
          const label = capitalize(formFieldType.replaceAll(/_/g, ' '));
          let value: TFormFieldInput['value'] = '';
          switch (formFieldType) {
            case 'phone': {
              value = '+1 123 456 7890';
              break;
            }
            case 'label': {
              value = 'Label';
              break;
            }
            case 'long_text': {
              value = {
                content: createDocumentWithText("This is a long text field's value"),
                contentText: "This is a long text field's value"
              };
              break;
            }
            case 'wallet': {
              value = '0x36d3515d5818f672168a595f68bae614ee6b91ee';
              break;
            }
            case 'date': {
              value = new Date('2021-10-10').toString();
              break;
            }
            case 'email': {
              value = 'johndoe@gmail.com';
              break;
            }
            case 'multiselect': {
              value = options.map((option) => option.id);
              break;
            }
            case 'number': {
              value = '123';
              break;
            }
            case 'select': {
              value = options[0].id;
              break;
            }
            case 'short_text': {
              value = 'This is a short text field value';
              break;
            }
            case 'url': {
              value = 'https://google.com';
              break;
            }
            case 'person': {
              value = [members[0].id];
              break;
            }
            default: {
              value = '';
              break;
            }
          }
          return {
            description: `This is a description for ${label.toLocaleLowerCase()}`,
            name: `${label} title`,
            options,
            private: index % 2 !== 0,
            required: index % 2 === 0,
            type: formFieldType,
            id: v4(),
            value
          };
        })}
      />
    </GlobalContext>
  );
}

export default {
  title: 'FormFields',
  component: FormFieldsEditor
};
