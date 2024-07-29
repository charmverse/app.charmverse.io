import type { FormFieldType, MemberPropertyType, FormField } from '@charmverse/core/prisma';
import type { PageContent } from '@root/lib/prosemirror/interfaces';

// based off app.charmverse.io brand colors
type SupportedColor =
  | 'gray'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'turquoise'
  | 'purple'
  | 'pink'
  | 'red';

export type UploadedFileInfo = { url: string; fileName: string; size?: number };

export type SelectOptionType = {
  id: string;
  name: string;
  color: SupportedColor;
  disabled?: boolean;
  dropdownName?: string;
  index?: number;
  temp?: boolean;
  variant?: 'chip' | 'plain';
};

// used by charm editor
export type LongTextValue = {
  content: PageContent;
  contentText: string;
};

export type ProjectFieldValue = {
  projectId: string;
  selectedMemberIds: string[];
};

export type OpProjectFieldValue = {
  projectTitle: string;
  projectRefUID: string;
};

export type FormFieldValue =
  | string
  | string[]
  | LongTextValue
  | UploadedFileInfo
  | ProjectFieldValue
  | OpProjectFieldValue;

export type FieldType = MemberPropertyType | FormFieldType;

export type FormFieldInput = Pick<
  FormField,
  'id' | 'description' | 'name' | 'index' | 'required' | 'private' | 'type' | 'fieldConfig'
> & {
  options?: SelectOptionType[];
};

export type FieldAnswerInput = {
  id?: string;
  fieldId: string;
  value: FormFieldValue;
};
