import type { SelectOptionType } from '@root/lib/forms/interfaces';
import { capitalize } from '@root/lib/utils/strings';
import { useState } from 'react';
import { withCharmEditorProviders } from 'stories/CharmEditor/renderEditor';
import { GlobalContext } from 'stories/lib/GlobalContext';
import { members } from 'stories/lib/mockData';
import { v4 } from 'uuid';

import { formFieldTypes } from 'components/common/form/constants';
import { FormFieldAnswers as CustomFormFieldAnswers } from 'components/common/form/FormFieldAnswers';
import { ControlledFormFieldsEditor } from 'components/common/form/FormFieldsEditor';
import { useFormFields } from 'components/common/form/hooks/useFormFields';
import type { FormFieldInput, FormFieldValue } from 'lib/forms/interfaces';
import { createDocumentWithText } from 'lib/prosemirror/constants';

const options: SelectOptionType[] = [
  {
    id: v4(),
    name: 'Option 1',
    color: 'blue'
  },
  {
    id: v4(),
    name: 'Option 2',
    color: 'green'
  },
  {
    id: v4(),
    name: 'Option 3',
    color: 'orange'
  }
];

export function FormFieldsEditor() {
  const field: FormFieldInput = {
    description: createDocumentWithText('This is a description'),
    index: 0,
    name: 'Title',
    options: [],
    private: false,
    required: true,
    type: 'short_text',
    id: v4(),
    fieldConfig: null
  };
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<string[]>([field.id]);
  const [formFields, setFormFields] = useState<FormFieldInput[]>([field]);

  return (
    <GlobalContext>
      <ControlledFormFieldsEditor
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
  const fields = formFieldTypes.map((formFieldType, index) => {
    const label = capitalize(formFieldType.replaceAll(/_/g, ' '));
    return {
      description: createDocumentWithText(`This is a description for ${label.toLocaleLowerCase()}`),
      name: `${label} title`,
      options: formFieldType.match(/select|multiselect/) ? options : [],
      private: index % 2 !== 0,
      required: index % 2 !== 0,
      type: formFieldType,
      id: v4(),
      value: '',
      fieldConfig: null
    };
  });
  const props = useFormFields({ fields });
  return (
    <GlobalContext>
      <CustomFormFieldAnswers
        {...props}
        isAuthor={true}
        enableComments={true}
        proposalId=''
        applyProject={() => {}}
        applyProjectMembers={() => {}}
        formFields={fields}
      />
    </GlobalContext>
  );
}

export function FormFieldsInputsDisplay() {
  const fields = formFieldTypes.map((formFieldType, index) => {
    const label = capitalize(formFieldType.replaceAll(/_/g, ' '));
    let value: FormFieldValue = '';
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
      description: createDocumentWithText(`This is a description for ${label.toLocaleLowerCase()}`),
      name: `${label} title`,
      options: formFieldType.match(/select|multiselect/) ? options : [],
      private: index % 2 !== 0,
      required: index % 2 === 0,
      type: formFieldType,
      id: v4(),
      value,
      fieldConfig: null
    };
  });
  const props = useFormFields({ fields });
  return (
    <GlobalContext>
      <CustomFormFieldAnswers
        {...props}
        isAuthor={true}
        proposalId=''
        enableComments={true}
        applyProject={() => {}}
        applyProjectMembers={() => {}}
        disabled
        formFields={fields}
      />
    </GlobalContext>
  );
}

export default {
  title: 'common/Structured Form',
  component: FormFieldsEditor,
  decorators: [withCharmEditorProviders]
};
