import { capitalize } from 'lodash';
import { GlobalContext } from 'stories/lib/GlobalContext';
import { v4 } from 'uuid';

import { formFieldTypes } from 'components/common/form/constants';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { FormFieldInputs as CustomFormFieldInputs } from 'components/common/form/FormFieldInputs';
import { FormFieldsEditor as CustomFormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import { brandColorNames } from 'theme/colors';

export function FormFieldsEditor() {
  return (
    <GlobalContext>
      <CustomFormFieldsEditor
        formFields={[
          {
            description: 'This is a description',
            index: 0,
            name: 'Title',
            options: [],
            private: false,
            required: true,
            type: 'text'
          }
        ]}
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
            private: false,
            required: index % 2 === 0,
            type: formFieldType,
            id: v4(),
            value: ''
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
