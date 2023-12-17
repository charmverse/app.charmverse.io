import { GlobalContext } from 'stories/lib/GlobalContext';

import { FormFieldsEditor } from 'components/common/FormFields/FormFieldsEditor';

export function FormFields() {
  return (
    <GlobalContext>
      <FormFieldsEditor
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

export default {
  title: 'FormFields/FormFieldsEditor',
  component: FormFields
};
