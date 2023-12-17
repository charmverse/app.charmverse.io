import { GlobalContext } from 'stories/lib/GlobalContext';

import { FormFields as CustomFormFields } from 'components/common/FormFields/FormFields';

export function FormFields() {
  return (
    <GlobalContext>
      <CustomFormFields
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
  title: 'FormFields/FormFields',
  component: FormFields
};
